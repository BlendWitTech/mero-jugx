import { Controller, Get, Query, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsQueryDto, TimeRangePreset } from './dto/analytics-query.dto';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('organization')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get organization analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'preset', enum: TimeRangePreset, required: false })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getOrganizationAnalytics(
    @CurrentUser() user: any,
    @Query() query: AnalyticsQueryDto,
  ) {
    const { preset = TimeRangePreset.LAST_30_DAYS, startDate, endDate } = query;

    let timeRange: { startDate: Date; endDate: Date } | undefined;

    if (preset === TimeRangePreset.CUSTOM) {
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required when preset is CUSTOM');
      }
      timeRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };
    } else {
      const endDate = new Date();
      let startDate: Date;

      switch (preset) {
        case TimeRangePreset.LAST_7_DAYS:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimeRangePreset.LAST_30_DAYS:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case TimeRangePreset.LAST_90_DAYS:
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case TimeRangePreset.LAST_YEAR:
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      timeRange = { startDate, endDate };
    }

    return this.analyticsService.getOrganizationAnalytics(user.organizationId, timeRange);
  }
}

