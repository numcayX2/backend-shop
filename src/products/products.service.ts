// src/products/products.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

export interface GetProductsQuery {
  keyword?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  color?: string;
}

// จำกัด field ที่อนุญาตให้ sort ได้ (กัน client ส่งมั่ว)
const ALLOWED_SORT_FIELDS = ['price', 'createdAt', 'name'];

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    return this.productModel.create(dto);
  }

  async findAll(query: GetProductsQuery): Promise<Product[]> {
    const filter = this.buildFilter(query);
    const sortOption = this.buildSort(query.sort);

    return this.productModel
      .find(filter)
      .sort(sortOption)
      .lean() // performance ดีขึ้น (ถ้าไม่ต้องใช้ instance method)
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).lean().exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getColors(): Promise<string[]> {
    return this.productModel.distinct('colors').exec();
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean()
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.productModel.findByIdAndDelete(id).lean().exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // -------------------------
  // Helper Methods
  // -------------------------

  private buildFilter(query: GetProductsQuery): Record<string, any> {
    const { keyword, category, minPrice, maxPrice, color } = query;
    const filter: Record<string, any> = {};

    if (keyword) {
      filter.name = {
        $regex: this.escapeRegex(keyword),
        $options: 'i',
      };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      };
    }

    if (color) {
      const colors = color.split(',').map((c) => c.trim());

      filter.colors = {
        $in: colors.map((c) => new RegExp(`^${this.escapeRegex(c)}$`, 'i')),
      };
    }

    return filter;
  }

  private buildSort(sort?: string): { [key: string]: 1 | -1 } {
    if (!sort) {
      return { createdAt: -1 };
    }

    const [field, order] = sort.split('_');

    if (!ALLOWED_SORT_FIELDS.includes(field)) {
      return { createdAt: -1 };
    }

    return {
      [field]: order === 'desc' ? -1 : 1,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
