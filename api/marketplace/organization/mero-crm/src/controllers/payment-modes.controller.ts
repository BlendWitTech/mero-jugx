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
import { PaymentModesService } from '../services/payment-modes.service';
import { CreatePaymentModeDto, UpdatePaymentModeDto } from '../dto/payment-mode.dto';

@ApiTags('CRM - Payment Modes')
@Controller('crm/payment-modes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PaymentModesController {
    constructor(private paymentModesService: PaymentModesService) { }

    @Post()
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Create a new payment mode' })
    @ApiResponse({ status: 201, description: 'Payment mode created successfully' })
    async create(
        @CurrentUser('organizationId') organizationId: string,
        @Body() createPaymentModeDto: CreatePaymentModeDto,
    ) {
        return this.paymentModesService.create(organizationId, createPaymentModeDto);
    }

    @Get()
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get all payment modes' })
    @ApiQuery({ name: 'enabledOnly', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Payment modes retrieved successfully' })
    async findAll(
        @CurrentUser('organizationId') organizationId: string,
        @Query('enabledOnly') enabledOnly?: boolean,
    ) {
        return this.paymentModesService.findAll(organizationId, enabledOnly === true || enabledOnly === (true as any));
    }

    @Get(':id')
    @Permissions('crm.invoices.view')
    @ApiOperation({ summary: 'Get payment mode by ID' })
    @ApiResponse({ status: 200, description: 'Payment mode retrieved successfully' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.paymentModesService.findOne(id, organizationId);
    }

    @Put(':id')
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Update payment mode' })
    @ApiResponse({ status: 200, description: 'Payment mode updated successfully' })
    async update(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() updatePaymentModeDto: UpdatePaymentModeDto,
    ) {
        return this.paymentModesService.update(id, organizationId, updatePaymentModeDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('crm.invoices.edit')
    @ApiOperation({ summary: 'Soft delete payment mode' })
    @ApiResponse({ status: 204, description: 'Payment mode deleted successfully' })
    async remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        await this.paymentModesService.remove(id, organizationId);
    }
}
