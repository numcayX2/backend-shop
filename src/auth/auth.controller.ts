import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Request } from 'express';

// Interface สำหรับบอกว่า req.user มีหน้าตาเป็นยังไง
interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
    refreshToken?: string;
  };
}

@Controller('auth')
export class AuthController {
  // <--- ต้องมีคำว่า export ตรงนี้ครับ
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Req() req: RequestWithUser) {
    const { sub: userId, email, role, refreshToken } = req.user;
    return this.authService.refreshTokens(userId, email, role, refreshToken!);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    return this.authService.logout(req.user.sub);
  }
}
