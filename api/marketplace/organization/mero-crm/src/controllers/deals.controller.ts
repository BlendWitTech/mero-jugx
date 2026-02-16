import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DealsService } from '../services/deals.service';
import { CreateDealDto, UpdateDealDto } from '../dto/deals.dto';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('crm/deals')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-crm')
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

    @Post()
    @Permissions('crm.deals.create')
    create(@Body() createDealDto: CreateDealDto, @Request() req) {
        return this.dealsService.create(createDealDto, req.user.organizationId);
    }

    @Get()
    @Permissions('crm.deals.view')
    findAll(@Request() req) {
        return this.dealsService.findAll(req.user.organizationId);
    }

    @Get(':id')
    @Permissions('crm.deals.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.dealsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('crm.deals.update')
    update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto, @Request() req) {
        return this.dealsService.update(id, updateDealDto, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('crm.deals.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.dealsService.remove(id, req.user.organizationId);
    }
}
