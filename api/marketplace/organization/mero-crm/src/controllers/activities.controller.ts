import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';
import { CreateActivityDto, UpdateActivityDto } from '../dto/activities.dto';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';

@Controller('crm/activities')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-crm')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    @Permissions('crm.activities.create')
    create(@Body() createActivityDto: CreateActivityDto, @Request() req) {
        return this.activitiesService.create(createActivityDto, req.user.organizationId);
    }

    @Get()
    @Permissions('crm.activities.view')
    findAll(
        @Request() req,
        @Query('lead_id') leadId?: string,
        @Query('deal_id') dealId?: string,
    ) {
        return this.activitiesService.findAll(req.user.organizationId, leadId, dealId);
    }

    @Get(':id')
    @Permissions('crm.activities.view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.activitiesService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Permissions('crm.activities.update')
    update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto, @Request() req) {
        return this.activitiesService.update(id, updateActivityDto, req.user.organizationId);
    }

    @Delete(':id')
    @Permissions('crm.activities.delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.activitiesService.remove(id, req.user.organizationId);
    }
}
