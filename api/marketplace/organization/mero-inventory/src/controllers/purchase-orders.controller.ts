import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/purchase-orders')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class PurchaseOrdersController {
    constructor(private readonly poService: PurchaseOrdersService) { }

    @Post()
    create(@Request() req, @Body() body: any) {
        return this.poService.create(req.organization.id, body);
    }

    @Get()
    findAll(@Request() req) {
        return this.poService.findAll(req.organization.id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.poService.findOne(req.organization.id, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.poService.update(req.organization.id, id, body);
    }

    @Post(':id/receive')
    receive(@Request() req, @Param('id') id: string, @Body('warehouseId') warehouseId: string) {
        return this.poService.receive(req.organization.id, id, warehouseId);
    }
}
