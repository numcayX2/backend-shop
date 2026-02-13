import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // 1. ดึงข้อมูล User พร้อม Password เพื่อใช้ตอน Login
  findByEmailWithSecrets(email: string) {
    return this.userModel
      .findOne({ email })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  // 2. ดึงข้อมูล User พร้อม Refresh Token เพื่อใช้ตอน Refresh
  findByIdWithRefresh(userId: string) {
    return this.userModel.findById(userId).select('+refreshTokenHash').exec();
  }

  // 3. สร้าง User ใหม่ รองรับ Role
  create(data: { email: string; passwordHash: string; role?: UserRole }) {
    return this.userModel.create({
      email: data.email,
      passwordHash: data.passwordHash,
      // ถ้าไม่มีการส่ง role มา ให้ default เป็น 'user'
      role: data.role ?? 'user',
    });
  }

  // 4. อัปเดต Refresh Token Hash
  setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    return this.userModel
      .updateOne({ _id: userId }, { refreshTokenHash })
      .exec();
  }

  // 5. อัปเดต Role (เผื่อใช้ในอนาคต)
  setRole(userId: string, role: UserRole) {
    return this.userModel.updateOne({ _id: userId }, { role }).exec();
  }
}
