import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { StockAdjustmentsService } from '../services/stock-adjustments.service';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/adjustments')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class StockAdjustmentsController {
    constructor(private readonly stockAdjustmentsService: StockAdjustmentsService) { }

    @Post()
    @Permissions('inventory.adjustments.create')
    create(@Body() data: any, @Request() req) {
        return this.stockAdjustmentsService.create(data, req.user.organizationId);
    }

    @Get()
    @Permissions('inventory.adjustments.view')
    findAll(@Request() req) {
        return this.stockAdjustmentsService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('inventory.adjustments.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.stockAdjustmentsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('inventory.adjustments.edit')
    update(@Param('id') id: string, @Body() data: any, @Request() req) {
        return this.stockAdjustmentsService.update(id, data, req.user.organizationId);
    }

    @Post(':id/approve')
    @Permissions('inventory.adjustments.approve')
    approve(@Param('id') id: string, @Request() req) {
        return this.stockAdjustmentsService.approve(id, req.user.id, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('inventory.adjustments.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.stockAdjustmentsService.remove(id, req.user.organizationId);
    }
}
