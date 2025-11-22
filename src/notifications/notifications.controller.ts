import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async getNotifications(@CurrentUser() user: any, @Query() query: NotificationQueryDto) {
    return this.notificationsService.getNotifications(user.userId, user.organizationId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.userId, user.organizationId || null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotificationById(@CurrentUser() user: any, @Param('id') notificationId: string) {
    return this.notificationsService.getNotificationById(
      user.userId,
      user.organizationId,
      notificationId,
    );
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read/unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.notificationsService.markAsRead(
      user.userId,
      user.organizationId,
      notificationId,
      dto,
    );
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(@CurrentUser() user: any, @Param('id') notificationId: string) {
    return this.notificationsService.deleteNotification(
      user.userId,
      user.organizationId,
      notificationId,
    );
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async getNotificationPreferences(@CurrentUser() user: any, @Query('scope') scope?: string) {
    return this.notificationsService.getNotificationPreferences(
      user.userId,
      user.organizationId || null, // Ensure null instead of undefined
      scope as any,
    );
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async updateNotificationPreferences(
    @CurrentUser() user: any,
    @Body() dto: NotificationPreferenceDto,
  ) {
    return this.notificationsService.updateNotificationPreferences(
      user.userId,
      user.organizationId,
      dto,
    );
  }
}
