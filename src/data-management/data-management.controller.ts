import { Controller, Get, Post, Body, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DataManagementService } from './data-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  BulkAssignRoleDto,
  BulkSendInvitationsDto,
  ImportUsersDto,
  ExportAuditLogsDto,
} from './dto/bulk-operations.dto';

@ApiTags('data-management')
@Controller('data-management')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Get('users/export')
  @Permissions('users.view')
  @ApiOperation({ summary: 'Export users to CSV' })
  @ApiResponse({ status: 200, description: 'Users exported successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportUsers(@CurrentUser() user: any, @Res() res: Response) {
    const csv = await this.dataManagementService.exportUsers(
      user.organizationId,
      user.userId,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
    res.send(csv);
  }

  @Post('users/import')
  @HttpCode(HttpStatus.OK)
  @Permissions('users.create')
  @ApiOperation({ summary: 'Import users from CSV' })
  @ApiResponse({ status: 200, description: 'Users imported successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async importUsers(@CurrentUser() user: any, @Body() dto: ImportUsersDto) {
    return this.dataManagementService.importUsers(
      user.organizationId,
      user.userId,
      dto.csv_data,
      dto.role_id,
    );
  }

  @Post('users/bulk-assign-role')
  @HttpCode(HttpStatus.OK)
  @Permissions('users.edit')
  @ApiOperation({ summary: 'Bulk assign role to users' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkAssignRole(@CurrentUser() user: any, @Body() dto: BulkAssignRoleDto) {
    return this.dataManagementService.bulkAssignRole(
      user.organizationId,
      user.userId,
      dto.user_ids,
      dto.role_id,
    );
  }

  @Post('invitations/bulk-send')
  @HttpCode(HttpStatus.OK)
  @Permissions('invitations.create')
  @ApiOperation({ summary: 'Bulk send invitations' })
  @ApiResponse({ status: 200, description: 'Invitations sent successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkSendInvitations(@CurrentUser() user: any, @Body() dto: BulkSendInvitationsDto) {
    return this.dataManagementService.bulkSendInvitations(
      user.organizationId,
      user.userId,
      dto.emails,
      dto.role_id,
    );
  }

  @Get('audit-logs/export')
  @Permissions('audit.view')
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async exportAuditLogs(
    @CurrentUser() user: any,
    @Body() dto: ExportAuditLogsDto,
    @Res() res: Response,
  ) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const csv = await this.dataManagementService.exportAuditLogs(
      user.organizationId,
      user.userId,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  }
}

