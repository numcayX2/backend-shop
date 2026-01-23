// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';

// 1. เพิ่ม Import ตรงนี้
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. เพิ่ม Block นี้เพื่อเปิดโฟลเดอร์รูปภาพ
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // ดึงค่า path จาก .env หรือใช้ค่า default เป็น 'uploads'
        const uploadDest = config.get<string>('UPLOAD_DEST') || './uploads';
        return [
          {
            rootPath: join(process.cwd(), uploadDest), // ชี้ไปที่โฟลเดอร์ uploads จริงๆ ในเครื่อง
            serveRoot: '/uploads', // ชื่อ URL ที่จะใช้เรียก (เช่น localhost:3000/uploads/...)
          },
        ];
      },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    ProductsModule,
  ],
})
export class AppModule {}
