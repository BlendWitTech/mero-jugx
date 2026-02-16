import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';
import { CurrentOrganization } from '../../../../../src/common/decorators/current-organization.decorator';

@Controller('inventory/reports')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard')
    getDashboardStats(@CurrentOrganization('id') orgId: string) {
        return this.reportsService.getDashboardStats(orgId);
    }

    @Get('stock-valuation')
    getStockValuation(@CurrentOrganization('id') orgId: string) {
        return this.reportsService.getStockValuation(orgId);
    }

    @Get('low-stock')
    getLowStockAlerts(
        @CurrentOrganization('id') orgId: string,
        @Query('threshold') threshold?: number
    ) {
        return this.reportsService.getLowStockAlerts(orgId, threshold ? Number(threshold) : 10);
    }

    @Get('stock-movements')
    getStockMovementHistory(
        @CurrentOrganization('id') orgId: string,
        @Query('limit') limit?: number
    ) {
        return this.reportsService.getStockMovementHistory(orgId, limit ? Number(limit) : 50);
    }
}
