import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../../src/auth/guards/jwt-auth.guard';
import { AppAccessGuard } from '../../../../../src/common/guards/app-access.guard';
import { PermissionsGuard } from '../../../../../src/common/guards/permissions.guard';
import { Permissions } from '../../../../../src/common/decorators/permissions.decorator';
import { AppSlug } from '../../../../../src/common/decorators/app-slug.decorator';
import { CurrentUser } from '../../../../../src/common/decorators/current-user.decorator';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto/payment.dto';

@ApiTags('CRM - Payments')
@Controller('crm/payments')
@UseGuards(JwtAuthGuard, AppAccessGuard, PermissionsGuard)
@AppSlug('mero-crm')
@ApiBearerAuth()
export class PaymentsController {
    constructor(private paymentsService: PaymentsService) { }

    @Post()
    @Permissions('crm.payments.create')
    @ApiOperation({ summary: 'Record a new payment' })
    @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
    async create(
        @CurrentUser('userId') userId: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() createPaymentDto: CreatePaymentDto,
    ) {
        return this.paymentsService.create(userId, organizationId, createPaymentDto);
    }

    @Get()
    @Permissions('crm.payments.view')
    @ApiOperation({ summary: 'Get all payments' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'invoiceId', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
    async findAll(
        @CurrentUser('organizationId') organizationId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('invoiceId') invoiceId?: string,
    ) {
        return this.paymentsService.findAll(
            organizationId,
            page ? parseInt(String(page), 10) : 1,
            limit ? parseInt(String(limit), 10) : 10,
            invoiceId,
        );
    }

    @Get(':id')
    @Permissions('crm.payments.view')
    @ApiOperation({ summary: 'Get payment by ID' })
    @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async findOne(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        return this.paymentsService.findOne(id, organizationId);
    }

    @Put(':id')
    @Permissions('crm.payments.edit')
    @ApiOperation({ summary: 'Update payment' })
    @ApiResponse({ status: 200, description: 'Payment updated successfully' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async update(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
        @Body() updatePaymentDto: UpdatePaymentDto,
    ) {
        return this.paymentsService.update(id, organizationId, updatePaymentDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Permissions('crm.payments.delete')
    @ApiOperation({ summary: 'Soft delete payment' })
    @ApiResponse({ status: 204, description: 'Payment deleted successfully' })
    @ApiResponse({ status: 404, description: 'Payment not found' })
    async remove(
        @Param('id') id: string,
        @CurrentUser('organizationId') organizationId: string,
    ) {
        await this.paymentsService.remove(id, organizationId);
    }
}
