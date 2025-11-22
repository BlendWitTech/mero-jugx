import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions('audit.view')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAuditLogs(@CurrentUser() user: any, @Query() query: AuditLogQueryDto) {
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    return this.auditLogsService.getAuditLogs(user.userId, user.organizationId, query);
  }

  @Get('stats')
  @Permissions('audit.view')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAuditLogStats(
    @CurrentUser() user: any,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    return this.auditLogsService.getAuditLogStats(
      user.userId,
      user.organizationId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('viewable-users')
  @Permissions('audit.view')
  @ApiOperation({ summary: 'Get users that can be viewed in audit logs' })
  @ApiResponse({ status: 200, description: 'Viewable users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getViewableUsers(@CurrentUser() user: any) {
    if (!user.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    return this.auditLogsService.getViewableUsers(user.userId, user.organizationId);
  }

  @Get(':id')
  @Permissions('audit.view')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit Log ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(@CurrentUser() user: any, @Param('id', ParseIntPipe) auditLogId: number) {
    return this.auditLogsService.getAuditLogById(user.userId, user.organizationId, auditLogId);
  }
}
