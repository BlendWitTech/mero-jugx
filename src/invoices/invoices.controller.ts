import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoiceStatus } from '../database/entities/invoices.entity';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Get invoices for organization' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(
    @CurrentUser() user: any,
    @Query('status') status?: InvoiceStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoicesService.getInvoices(
      user.organizationId,
      user.userId,
      status,
      page || 1,
      limit || 20,
    );
  }

  @Get(':id')
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Get single invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.getInvoice(user.organizationId, user.userId, id);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @Permissions('packages.edit')
  @ApiOperation({ summary: 'Pay a single invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invoice already paid' })
  async payInvoice(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('payment_method') paymentMethod: 'stripe' | 'esewa',
  ) {
    return this.invoicesService.payInvoice(
      user.organizationId,
      user.userId,
      id,
      paymentMethod,
    );
  }

  @Post('pay-all')
  @HttpCode(HttpStatus.OK)
  @Permissions('packages.edit')
  @ApiOperation({ summary: 'Pay all unpaid invoices' })
  @ApiResponse({ status: 200, description: 'Payments initiated successfully' })
  @ApiResponse({ status: 400, description: 'No unpaid invoices found' })
  async payAllInvoices(
    @CurrentUser() user: any,
    @Body('payment_method') paymentMethod: 'stripe' | 'esewa',
  ) {
    return this.invoicesService.payAllInvoices(
      user.organizationId,
      user.userId,
      paymentMethod,
    );
  }
}

