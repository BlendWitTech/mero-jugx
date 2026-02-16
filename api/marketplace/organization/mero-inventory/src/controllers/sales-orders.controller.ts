import { Controller, Get, Post, Body, Put, Param, UseGuards, Request } from '@nestjs/common';
import { SalesOrdersService } from '../services/sales-orders.service';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { SalesOrderStatus } from '../entities/sales-order.entity';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/sales-orders')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class SalesOrdersController {
    constructor(private readonly salesOrdersService: SalesOrdersService) { }

    @Post()
    create(
        @Body() createDto: CreateSalesOrderDto,
        @Request() req
    ) {
        return this.salesOrdersService.create(createDto, req.user.organizationId, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.salesOrdersService.findAll(req.user.organizationId);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Request() req
    ) {
        return this.salesOrdersService.findOne(id, req.user.organizationId);
    }

    @Put(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: SalesOrderStatus,
        @Request() req
    ) {
        return this.salesOrdersService.updateStatus(id, status, req.user.organizationId, req.user.userId);
    }
}
