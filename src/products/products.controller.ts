import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards, // <--- 1. อย่าลืม Import อันนี้
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { GetProductsQuery } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { PRODUCT_IMAGE } from './products.constants';

// --- Import Guards และ Decorator ---
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- Public Routes (ใครก็ดูได้) ---

  @Get('colors')
  getColors() {
    return this.productsService.getColors();
  }

  @Get('max-price')
  getMaxPrice() {
    return this.productsService.findMaxPrice();
  }

  @Get()
  findAll(@Query() query: GetProductsQuery) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // --- Protected Routes (ต้องเป็น Admin เท่านั้น) ---

  @Post()
  @UseGuards(AccessTokenGuard, RolesGuard) // 1. เช็ค Login + เช็ค Role
  @Roles('admin') // 2. ระบุว่าต้องเป็น admin
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PRODUCT_IMAGE.MAX_SIZE }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.productsService.create(dto, file);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard) // <-- ล็อคการแก้ไขด้วย
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: PRODUCT_IMAGE.MAX_SIZE }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard) // <-- ล็อคการลบด้วย
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
