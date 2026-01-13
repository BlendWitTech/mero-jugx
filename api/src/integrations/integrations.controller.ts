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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { ApiKeyService } from './api-key.service';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) {}

  // API Keys
  @Post('api-keys')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createApiKey(@CurrentUser() user: any, @Body() dto: CreateApiKeyDto) {
    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
    return this.apiKeyService.createApiKey(
      user.organizationId,
      user.userId,
      dto.name,
      dto.description || null,
      dto.permissions || null,
      expiresAt,
    );
  }

  @Get('api-keys')
  @Permissions('integrations.view')
  @ApiOperation({ summary: 'List all API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async listApiKeys(@CurrentUser() user: any) {
    return this.apiKeyService.listApiKeys(user.organizationId, user.userId);
  }

  @Put('api-keys/:id')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Update an API key' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  async updateApiKey(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    const updates: any = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.permissions !== undefined) updates.permissions = dto.permissions;
    if (dto.expires_at !== undefined) {
      updates.expires_at = dto.expires_at ? new Date(dto.expires_at) : null;
    }

    return this.apiKeyService.updateApiKey(
      user.organizationId,
      user.userId,
      id,
      updates,
    );
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 204, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  async revokeApiKey(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeyService.revokeApiKey(user.organizationId, user.userId, id);
  }

  // Webhooks
  @Post('webhooks')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createWebhook(@CurrentUser() user: any, @Body() dto: CreateWebhookDto) {
    return this.webhookService.createWebhook(
      user.organizationId,
      user.userId,
      dto.name,
      dto.description || null,
      dto.url,
      dto.events,
      dto.secret || null,
    );
  }

  @Get('webhooks')
  @Permissions('integrations.view')
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async listWebhooks(@CurrentUser() user: any) {
    return this.webhookService.listWebhooks(user.organizationId, user.userId);
  }

  @Put('webhooks/:id')
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async updateWebhook(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const updates: any = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.url !== undefined) updates.url = dto.url;
    if (dto.events !== undefined) updates.events = dto.events;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.secret !== undefined) updates.secret = dto.secret;

    return this.webhookService.updateWebhook(
      user.organizationId,
      user.userId,
      id,
      updates,
    );
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('integrations.manage')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  async deleteWebhook(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhookService.deleteWebhook(user.organizationId, user.userId, id);
  }
}

