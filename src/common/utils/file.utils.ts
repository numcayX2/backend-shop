// src/common/utils/file.utils.ts
import { promises as fs } from 'fs';
import * as path from 'path';

export async function safeUnlinkByRelativePath(relativePath: string) {
  if (!relativePath) return;

  const normalized = path
    .normalize(relativePath)
    .replace(/^(\.\.(\/|\\|$))+/, '');

  try {
    await fs.unlink(normalized);
  } catch (err) {
    // กำหนด Type ให้ err เป็น Object ที่มี property code (เป็น optional string)
    const error = err as { code?: string };

    // ตรวจสอบ error code อย่างปลอดภัย
    if (error.code !== 'ENOENT') {
      throw err;
    }
  }
}
