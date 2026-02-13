import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// สร้าง Enum เพื่อกำหนด Role ที่อนุญาต
export type UserRole = 'admin' | 'user';

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  // select: false เพื่อความปลอดภัย ไม่ให้ส่งรหัสผ่านกลับไปตอน Query ปกติ
  @Prop({ required: true, select: false })
  passwordHash!: string;

  // เพิ่ม Role: กำหนดค่า default เป็น 'user'
  @Prop({ required: true, default: 'user' })
  role!: string;

  // เพิ่ม Refresh Token Hash: ต้องซ่อน (select: false) และอนุญาตให้เป็น null ได้
  @Prop({ select: false, default: null })
  refreshTokenHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
