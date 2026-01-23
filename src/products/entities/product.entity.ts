import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop([String])
  colors: string[];

  @Prop({ required: true, min: 0, max: 1_000_000_000_000 })
  price: number;

  @Prop({ maxlength: 3000 })
  description: string;

  @Prop() // เก็บเป็น String (Path ของไฟล์) เช่น 'uploads/xxx-xxx.jpg'
  imageUrl: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
