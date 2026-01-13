import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/common/guards/permissions.guard';
import { Permissions } from '@src/common/decorators/permissions.decorator';
import { CurrentUser } from '@src/common/decorators/current-user.decorator';
import { TaxesService } from '../services/taxes.service';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';

@ApiTags('CRM - Taxes')
@Controller('crm/taxes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TaxesController {
    constructor(private taxesService: TaxesService) { }

    @Post()
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Create a new tax' })
    @ApiResponse({ status: 201, description: 'Tax created successfully' })
    async create(
        @CurrentUser('organizationId') organizationId: string,
        @Body() createTaxDto: CreateTaxDto,
    ) {
        return this.taxesService.create(organizationId, createTaxDto);
    }

    @Get()
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get all taxes' })
    @ApiQuery({ name: 'enabledOnly', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Taxes retrieved successfully' })
    async findAll(
        @CurrentUser('organizationId') organizationId: string,
        @Query('enabledOnly') enabledOnly?: boolean,
    ) {
        return this.taxesService.findAll(organizationId, enabledOnly === true || enabledOnly === (true as any));
    }

    @Get(':id')
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get tax by ID' })
    @ApiResponse({ status: 200, description: 'Tax retrieved successfully' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.taxesService.findOne(id, organizationId);
    }

    @Put(':id')
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Update tax' })
    @ApiResponse({ status: 200, description: 'Tax updated successfully' })
    async update(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() updateTaxDto: UpdateTaxDto,
    ) {
        return this.taxesService.update(id, organizationId, updateTaxDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Soft delete tax' })
    @ApiResponse({ status: 204, description: 'Tax deleted successfully' })
    async remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        await this.taxesService.remove(id, organizationId);
    }
}
