import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { EmailTemplateService, EmailTemplate } from './email-template.service';
import { SmsService } from './sms.service';
import { PushNotificationService, PushNotificationPayload } from './push-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('communication')
@Controller('communication')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  // Email Templates
  @Post('email-templates')
  @Permissions('organizations.settings')
  @ApiOperation({ summary: 'Create or update an email template' })
  @ApiResponse({ status: 201, description: 'Email template saved successfully' })
  async saveEmailTemplate(@CurrentUser() user: any, @Body() template: EmailTemplate) {
    return this.emailTemplateService.saveTemplate(
      user.organizationId,
      user.userId,
      template,
    );
  }

  @Get('email-templates')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'List email templates' })
  @ApiResponse({ status: 200, description: 'Email templates retrieved successfully' })
  async listEmailTemplates(@CurrentUser() user: any) {
    return this.emailTemplateService.listTemplates(user.organizationId, user.userId);
  }

  @Get('email-templates/:name')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get an email template' })
  @ApiResponse({ status: 200, description: 'Email template retrieved successfully' })
  async getEmailTemplate(@CurrentUser() user: any, @Param('name') name: string) {
    return this.emailTemplateService.getTemplate(user.organizationId, name);
  }

  // SMS
  @Post('sms/send')
  @Permissions('organizations.settings')
  @ApiOperation({ summary: 'Send SMS' })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  async sendSms(
    @CurrentUser() user: any,
    @Body() dto: { to: string; message: string },
  ) {
    return this.smsService.sendSms(dto.to, dto.message);
  }

  // Push Notifications
  @Post('push/send')
  @Permissions('organizations.settings')
  @ApiOperation({ summary: 'Send push notification' })
  @ApiResponse({ status: 200, description: 'Push notification sent successfully' })
  async sendPushNotification(
    @CurrentUser() user: any,
    @Body() dto: { deviceToken: string; payload: PushNotificationPayload },
  ) {
    return this.pushNotificationService.sendPushNotification(dto.deviceToken, dto.payload);
  }
}

