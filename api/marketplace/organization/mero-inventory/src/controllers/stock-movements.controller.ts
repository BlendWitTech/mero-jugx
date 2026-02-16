import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { StockMovementsService } from '../services/stock-movements.service';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('inventory/stock-movements')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-inventory')
export class StockMovementsController {
    constructor(private readonly stockMovementsService: StockMovementsService) { }

    @Get()
    @Permissions('inventory.stock_movements.view')
    findAll(@Request() req, @Query() query: any) {
        return this.stockMovementsService.findAll(req.user.organizationId, query);
    }
}
