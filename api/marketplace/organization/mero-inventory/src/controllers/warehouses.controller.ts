import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WarehousesService } from '../services/warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/warehouses')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class WarehousesController {
    constructor(private readonly warehousesService: WarehousesService) { }

    @Post()
    @Permissions('inventory.warehouses.create')
    create(@Body() createWarehouseDto: CreateWarehouseDto, @Request() req) {
        return this.warehousesService.create(createWarehouseDto, req.user.organizationId);
    }

    @Get()
    @Permissions('inventory.warehouses.view')
    findAll(@Request() req) {
        return this.warehousesService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('inventory.warehouses.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.warehousesService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('inventory.warehouses.edit')
    update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto, @Request() req) {
        return this.warehousesService.update(id, updateWarehouseDto, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('inventory.warehouses.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.warehousesService.remove(id, req.user.organizationId);
    }
}
