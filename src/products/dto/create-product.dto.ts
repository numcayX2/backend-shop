// src/products/dto/create-product.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // สมาชิกข้างใน Array ต้องเป็น String ทุกตัว
  colors?: string[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number) // แปลงค่าเป็น number
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
