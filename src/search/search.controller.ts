import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchQueryDto, ChatSearchQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Global search across all entities' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async globalSearch(@CurrentUser() user: any, @Query() query: SearchQueryDto) {
    return this.searchService.globalSearch(
      user.organizationId,
      query.q,
      query.limit,
    );
  }

  @Get('chat/:chatId')
  @Permissions('chat.view')
  @ApiOperation({ summary: 'Search messages within a specific chat' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  async searchChatMessages(
    @CurrentUser() user: any,
    @Param('chatId') chatId: string,
    @Query() query: ChatSearchQueryDto,
  ) {
    return this.searchService.searchChatMessages(chatId, query.q, query.limit);
  }
}

