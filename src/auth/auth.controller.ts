import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  // Helper: สร้าง Dual Tokens (Access + Refresh)
  private async signTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: parseInt(
          this.config.get<string>('JWT_ACCESS_EXPIRATION') ?? '900',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: parseInt(
          this.config.get<string>('JWT_REFRESH_EXPIRATION') ?? '604800',
        ),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // Helper: Hash Refresh Token แล้วเก็บลง DB
  private async storeRefreshHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.usersService.setRefreshTokenHash(userId, hash);
  }

  async signUp(dto: AuthDto) {
    const email = this.normalizeEmail(dto.email);
    const userExists = await this.usersService.findByEmail(email);
    if (userExists) throw new BadRequestException('Email นี้ถูกใช้งานแล้ว');

    const passwordHash = await argon2.hash(dto.password);

    const newUser = await this.usersService.create({
      email,
      passwordHash,
      role: 'user',
    });

    const tokens = await this.signTokens({
      id: String(newUser._id),
      email: newUser.email,
      role: newUser.role,
    });

    await this.storeRefreshHash(String(newUser._id), tokens.refresh_token);

    return tokens;
  }

  async signIn(dto: AuthDto) {
    const email = this.normalizeEmail(dto.email);

    // เรียกใช้ Method ที่ดึง PasswordHash มาตรวจสอบ
    const user = await this.usersService.findByEmailWithSecrets(email);
    if (!user) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const tokens = await this.signTokens({
      id: String(user._id),
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshHash(String(user._id), tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(
    userId: string,
    email: string,
    role: string,
    refreshToken: string,
  ) {
    if (!refreshToken) throw new ForbiddenException('Access Denied');

    // ดึง User พร้อม RefreshTokenHash จาก DB
    const user = await this.usersService.findByIdWithRefresh(userId);
    if (!user || !user.refreshTokenHash)
      throw new ForbiddenException('Access Denied');

    const matches = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!matches) throw new ForbiddenException('Access Denied');

    const tokens = await this.signTokens({ id: userId, email, role });

    // Rotate Token: อัปเดต Hash ใหม่ลง DB
    await this.storeRefreshHash(userId, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    // ลบ Hash ออกจาก DB (set เป็น null)
    await this.usersService.setRefreshTokenHash(userId, null);
    return { message: 'Logged out successfully' };
  }
}
