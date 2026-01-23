// src/products/entities/product.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// สร้าง Type ProductDocument เพื่อให้ TypeScript รู้จัก
export type ProductDocument = Product & Document;

@Schema({ timestamps: true }) // เปิด timestamps เพื่อให้มี createdAt, updatedAt
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  category: string;

  @Prop()
  imageUrl: string;

  @Prop([String])
  colors: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
