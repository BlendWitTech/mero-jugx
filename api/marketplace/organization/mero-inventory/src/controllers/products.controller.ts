import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/products')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Permissions('inventory.products.create')
    create(@Body() createProductDto: CreateProductDto, @Request() req) {
        return this.productsService.create(createProductDto, req.user.organizationId);
    }

    @Get()
    @Permissions('inventory.products.view')
    findAll(@Request() req) {
        return this.productsService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('inventory.products.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.productsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('inventory.products.edit')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
        return this.productsService.update(id, updateProductDto, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('inventory.products.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.productsService.remove(id, req.user.organizationId);
    }

    @Post(':id/adjust-stock')
    @Permissions('inventory.products.edit')
    adjustStock(@Param('id') id: string, @Body() data: any, @Request() req) {
        return this.productsService.adjustStock(id, data, req.user.organizationId);
    }
}
