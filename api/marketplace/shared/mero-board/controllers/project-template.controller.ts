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
import { ProjectTemplateService } from '../services/project-template.service';
import { JwtAuthGuard } from '../../../../src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../../../src/common/decorators/current-organization.decorator';
import { CreateProjectTemplateDto } from '../dto/create-project-template.dto';
import { UseProjectTemplateDto } from '../dto/use-project-template.dto';

@ApiTags('mero-board-project-templates')
@Controller('apps/:appSlug/project-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectTemplateController {
  constructor(private readonly templateService: ProjectTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() createDto: CreateProjectTemplateDto,
  ) {
    return this.templateService.createTemplate(
      user.userId,
      organization.id,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all project templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
  ) {
    return this.templateService.getTemplates(user.userId, organization.id, true);
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'Get a specific project template' })
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
  @ApiOperation({ summary: 'Use a project template to create a project' })
  @ApiResponse({ status: 201, description: 'Project created from template successfully' })
  async useTemplate(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('appSlug') appSlug: string,
    @Body() useDto: UseProjectTemplateDto,
  ) {
    return this.templateService.useTemplate(user.userId, organization.id, useDto);
  }

  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project template' })
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


