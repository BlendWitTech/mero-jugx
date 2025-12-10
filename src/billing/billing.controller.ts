import { Controller, Get, Post, Param, Query, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('history')
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Get billing history' })
  @ApiResponse({ status: 200, description: 'Billing history retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getBillingHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.getBillingHistory(
      user.organizationId,
      user.userId,
      page || 1,
      limit || 20,
    );
  }

  @Get('subscription')
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getSubscriptionDetails(@CurrentUser() user: any) {
    return this.billingService.getSubscriptionDetails(
      user.organizationId,
      user.userId,
    );
  }

  @Get('invoice/:paymentId')
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Get invoice data for a payment' })
  @ApiResponse({ status: 200, description: 'Invoice data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async getInvoice(
    @CurrentUser() user: any,
    @Param('paymentId') paymentId: string,
  ) {
    return this.billingService.generateInvoice(
      user.organizationId,
      user.userId,
      paymentId,
    );
  }

  @Get('invoice/:paymentId/export')
  @Permissions('packages.view')
  @ApiOperation({ summary: 'Export invoice as CSV' })
  @ApiResponse({ status: 200, description: 'Invoice exported successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async exportInvoice(
    @CurrentUser() user: any,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const csv = await this.billingService.exportInvoice(
      user.organizationId,
      user.userId,
      paymentId,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${paymentId}-${Date.now()}.csv`);
    res.send(csv);
  }

  @Post('subscription/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('packages.edit')
  @ApiOperation({ summary: 'Cancel subscription auto-renewal' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can cancel subscription' })
  async cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(
      user.organizationId,
      user.userId,
    );
  }

  @Post('subscription/resume')
  @HttpCode(HttpStatus.OK)
  @Permissions('packages.edit')
  @ApiOperation({ summary: 'Resume subscription auto-renewal' })
  @ApiResponse({ status: 200, description: 'Subscription resumed successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can resume subscription' })
  async resumeSubscription(@CurrentUser() user: any) {
    return this.billingService.resumeSubscription(
      user.organizationId,
      user.userId,
    );
  }
}

