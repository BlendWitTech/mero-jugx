import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { DocumentsService } from './documents.service';
import { OrganizationDocument, DocumentType } from '../database/entities/organization-document.entity';
import { Response } from 'express';
import * as fs from 'fs/promises';

// Type definition for uploaded file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@ApiTags('documents')
@Controller('organizations/me/documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get all organization documents' })
  async getDocuments(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<OrganizationDocument[]> {
    return this.documentsService.getDocuments(user.userId, organization.id);
  }

  @Get(':id')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocumentById(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
  ): Promise<OrganizationDocument> {
    return this.documentsService.getDocumentById(user.userId, organization.id, documentId);
  }

  @Get(':id/download')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Download document file' })
  async downloadDocument(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const fileInfo = await this.documentsService.getDocumentFile(
      user.userId,
      organization.id,
      documentId,
    );

    const fileBuffer = await fs.readFile(fileInfo.filePath);
    
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    res.send(fileBuffer);
  }

  @Post()
  @Permissions('organizations.edit')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        document_type: {
          type: 'string',
          enum: Object.values(DocumentType),
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document' })
  async uploadDocument(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @UploadedFile() file: MulterFile,
    @Query('document_type') documentType: DocumentType,
    @Query('title') title?: string,
    @Query('description') description?: string,
  ): Promise<OrganizationDocument> {
    if (!file) {
      throw new Error('File is required');
    }

    if (!documentType || !Object.values(DocumentType).includes(documentType)) {
      throw new Error('Valid document_type is required');
    }

    return this.documentsService.createDocument(
      user.userId,
      organization.id,
      file,
      documentType,
      title,
      description,
    );
  }

  @Delete(':id')
  @Permissions('organizations.edit')
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
  ): Promise<{ message: string }> {
    return this.documentsService.deleteDocument(user.userId, organization.id, documentId);
  }
}

