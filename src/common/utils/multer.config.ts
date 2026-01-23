// src/common/utils/multer.config.ts
import { MulterModuleAsyncOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

interface MulterImageOptions {
  maxSize: number;
  allowedMimeTypes: string[];
}

export const multerConfigFactory = (
  folderName: string,
  options: MulterImageOptions,
): MulterModuleAsyncOptions => ({
  // ลบคำว่า async ออกตรงนี้
  useFactory: () => {
    // กำหนด Root Upload Folder (ถ้าไม่มีใน .env จะใช้ ./uploads เป็นค่าเริ่มต้น)
    const uploadRoot = process.env.UPLOAD_DEST || './uploads';
    const uploadPath = path.join(uploadRoot, folderName);

    // ตรวจสอบว่ามี Folder หรือไม่ ถ้าไม่มีให้สร้างใหม่
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadPath),
        filename: (_req, file, cb) => {
          // ตั้งชื่อไฟล์ใหม่ด้วย UUID เพื่อป้องกันชื่อซ้ำ
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: options.maxSize },
      fileFilter: (_req, file, cb) => {
        // กรองประเภทไฟล์ที่อนุญาต
        if (!options.allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type'), false);
        }
        cb(null, true);
      },
    };
  },
});
