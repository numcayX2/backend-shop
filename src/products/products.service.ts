// src/products/products.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose'; // 1. ตัด FilterQuery ออก (เหลือแค่ SortOrder)
import { Product, ProductDocument } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface GetProductsQuery {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  color?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private saveImage(file: Express.Multer.File): string {
    if (!file.buffer) {
      return `products/${file.filename}`;
    }
    const uploadDir = './uploads/products';

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // ตั้งชื่อไฟล์ใหม่: timestamp-random.ext
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, fileName);

    // เขียนไฟล์ลง disk
    fs.writeFileSync(filePath, file.buffer);

    // Return path ที่จะเก็บใน DB
    return `products/${fileName}`;
  }

  private deleteImage(imagePath: string) {
    const fullPath = path.join('./uploads', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  // 1. Create Product
  async create(
    createProductDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const data: Partial<Product> = { ...createProductDto };

    if (file) {
      data.imageUrl = this.saveImage(file);
    }

    const newProduct = new this.productModel(data);
    return await newProduct.save();
  }

  // 2. Find All
  async findAll(query: GetProductsQuery): Promise<Product[]> {
    const { keyword, category, minPrice, maxPrice, sort, color } = query;
    const filter: Record<string, any> = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (category) {
      filter.category = category;
    }

    // ✅ แก้ไข Logic Price ตรงนี้ครับ
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: Record<string, number> = {};
      let hasPriceFilter = false;

      // เช็คว่ามีค่า และแปลงเป็น String แล้วไม่ว่างเปล่า
      if (minPrice !== undefined && String(minPrice).trim() !== '') {
        priceQuery.$gte = Number(minPrice);
        hasPriceFilter = true;
      }

      // เช็คว่ามีค่า และแปลงเป็น String แล้วไม่ว่างเปล่า (แก้ปัญหา maxPrice="" กลายเป็น 0)
      if (maxPrice !== undefined && String(maxPrice).trim() !== '') {
        priceQuery.$lte = Number(maxPrice);
        hasPriceFilter = true;
      }

      // ถ้ามีการตั้งค่าจริง ค่อยยัดใส่ filter
      if (hasPriceFilter) {
        filter.price = priceQuery;
      }
    }

    if (color) {
      const colorsArray = color
        .split(',')
        .map((c) => new RegExp(`^${c.trim()}$`, 'i'));
      filter.colors = { $in: colorsArray };
    }

    let sortOption: { [key: string]: SortOrder } = { createdAt: -1 };

    if (sort) {
      if (sort === 'price_asc') sortOption = { price: 1 };
      else if (sort === 'price_desc') sortOption = { price: -1 };
      else if (sort === 'name_asc') sortOption = { name: 1 };
      else if (sort === 'name_desc') sortOption = { name: -1 };
    }

    return this.productModel.find(filter).sort(sortOption).exec();
  }

  async findMaxPrice(): Promise<{ maxPrice: number }> {
    // หา 1 ตัวที่แพงที่สุด (sort price -1)
    const product = await this.productModel
      .findOne()
      .sort({ price: -1 })
      .select('price') // เอาแค่ field price พอ
      .exec();

    return { maxPrice: product ? product.price : 0 };
  }

  // 3. Find One
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  // 4. Update Product
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ): Promise<Product> {
    const existingProduct = await this.productModel.findById(id).exec();
    if (!existingProduct) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const updateData: Partial<Product> = { ...updateProductDto };

    if (file) {
      if (existingProduct.imageUrl) {
        this.deleteImage(existingProduct.imageUrl);
      }
      updateData.imageUrl = this.saveImage(file);
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedProduct) throw new NotFoundException();
    return updatedProduct;
  }

  // 5. Remove Product
  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    if (deletedProduct.imageUrl) {
      this.deleteImage(deletedProduct.imageUrl);
    }

    return deletedProduct;
  }

  // 6. Get Colors
  async getColors(): Promise<string[]> {
    const products = await this.productModel.find().select('colors').exec();
    const allColors = products.flatMap((p) => p.colors || []);
    return Array.from(new Set(allColors.map((c) => c.toLowerCase()))).sort();
  }
}
