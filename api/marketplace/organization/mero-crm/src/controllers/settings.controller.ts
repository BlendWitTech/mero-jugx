import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/common/guards/permissions.guard';
import { Permissions } from '@src/common/decorators/permissions.decorator';
import { CurrentUser } from '@src/common/decorators/current-user.decorator';
import { CrmSettingsService } from '../services/settings.service';
import { UpdateCrmSettingDto, BatchUpdateCrmSettingsDto } from '../dto/setting.dto';

@ApiTags('CRM - Settings')
@Controller('crm/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CrmSettingsController {
    constructor(private settingsService: CrmSettingsService) { }

    @Get()
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get all CRM settings for organization' })
    @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
    async findAll(@CurrentUser('organizationId') organizationId: string) {
        return this.settingsService.findAll(organizationId);
    }

    @Get(':key')
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get specific CRM setting' })
    async findOne(
        @CurrentUser('organizationId') organizationId: string,
        @Param('key') key: string,
    ) {
        return this.settingsService.findOne(organizationId, key);
    }

    @Put()
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Batch update CRM settings' })
    async batchUpdate(
        @CurrentUser('organizationId') organizationId: string,
        @Body() batchUpdateDto: BatchUpdateCrmSettingsDto,
    ) {
        return this.settingsService.batchUpdate(organizationId, batchUpdateDto);
    }

    @Put(':key')
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Update specific CRM setting' })
    async update(
        @CurrentUser('organizationId') organizationId: string,
        @Param('key') key: string,
        @Body() updateDto: UpdateCrmSettingDto,
    ) {
        return this.settingsService.update(organizationId, key, updateDto.settingValue);
    }
}
