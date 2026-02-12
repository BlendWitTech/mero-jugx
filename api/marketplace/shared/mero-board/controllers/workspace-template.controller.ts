import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { WorkspaceTemplateService } from '../services/workspace-template.service';
import { JwtAuthGuard } from '../../../../src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../src/common/decorators/current-organization.decorator';
import { CreateWorkspaceTemplateDto } from '../dto/create-workspace-template.dto';
import { UseWorkspaceTemplateDto } from '../dto/use-workspace-template.dto';

@ApiTags('mero-board-workspace-templates')
@Controller('apps/:appSlug/workspace-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceTemplateController {
  constructor(private readonly templateService: WorkspaceTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a workspace template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() createDto: CreateWorkspaceTemplateDto,
  ) {
    return this.templateService.createTemplate(
      user.userId,
      organization.id,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspace templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
  ) {
    return this.templateService.getTemplates(user.userId, organization.id, true);
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'Get a specific workspace template' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  async getTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('templateId') templateId: string,
  ) {
    return this.templateService.getTemplate(user.userId, organization.id, templateId);
  }

  @Post('use')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Use a workspace template to create a workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created from template successfully' })
  async useTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() useDto: UseWorkspaceTemplateDto,
  ) {
    return this.templateService.useTemplate(user.userId, organization.id, useDto);
  }

  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace template' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  async deleteTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Param('templateId') templateId: string,
  ) {
    await this.templateService.deleteTemplate(user.userId, organization.id, templateId);
  }
}


