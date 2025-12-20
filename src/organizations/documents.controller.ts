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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { DocumentsService } from './documents.service';
import {
  OrganizationDocument,
  DocumentType,
} from '../database/entities/organization_documents.entity';
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
  @ApiOperation({ 
    summary: 'Get all organization documents',
    description: 'Retrieve all documents for the current organization. Requires organizations.view permission.'
  })
  @ApiResponse({ status: 200, description: 'List of documents retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getDocuments(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<OrganizationDocument[]> {
    return this.documentsService.getDocuments(user.userId, organization.id);
  }

  @Get(':id')
  @Permissions('organizations.view')
  @ApiOperation({ 
    summary: 'Get document by ID',
    description: 'Retrieve a specific document by its ID. Requires organizations.view permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentById(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
  ): Promise<OrganizationDocument> {
    return this.documentsService.getDocumentById(user.userId, organization.id, documentId);
  }

  @Get(':id/view')
  @Permissions('organizations.view')
  @ApiOperation({ 
    summary: 'View document file (inline)',
    description: 'View a document file in the browser (inline display). Requires organizations.view permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Document file streamed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async viewDocument(
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
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`);
    res.send(fileBuffer);
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
          description: 'Document file (max 50MB). Allowed types: PDF, images, Office documents, text files',
        },
        document_type: {
          type: 'string',
          enum: Object.values(DocumentType),
          description: 'Type of document',
        },
        title: {
          type: 'string',
          description: 'Optional document title',
        },
        description: {
          type: 'string',
          description: 'Optional document description',
        },
      },
      required: ['file', 'document_type'],
    },
  })
  @ApiOperation({ 
    summary: 'Upload a document',
    description: 'Upload a new document. File size limit: 50MB. Freemium packages can only upload/view basic documents. Requires organizations.edit permission.'
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
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
  @ApiOperation({ 
    summary: 'Delete a document',
    description: 'Soft delete a document. The file will be removed from storage and the record will be marked as deleted. Requires organizations.edit permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
  ): Promise<{ message: string }> {
    return this.documentsService.deleteDocument(user.userId, organization.id, documentId);
  }

  @Post(':id/scan')
  @Permissions('organizations.edit')
  @ApiOperation({ 
    summary: 'Scan a document (OCR) - Non-freemium only',
    description: 'Scan a document using OCR technology. Only available for non-freemium packages. Requires documents.scan permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Document scanned successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async scanDocument(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
  ): Promise<OrganizationDocument> {
    return this.documentsService.scanDocument(user.userId, organization.id, documentId);
  }

  @Post(':id/signature')
  @Permissions('organizations.edit')
  @UseInterceptors(FileInterceptor('signature'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Add signature to document - Non-freemium only',
    description: 'Add a signature image to a document. Only available for non-freemium packages. Requires documents.signatures permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Signature added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature file' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async addSignature(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
    @UploadedFile() signatureFile: MulterFile,
  ): Promise<OrganizationDocument> {
    if (!signatureFile) {
      throw new Error('Signature file is required');
    }
    return this.documentsService.addSignature(user.userId, organization.id, documentId, signatureFile);
  }

  @Post(':id/logo')
  @Permissions('organizations.edit')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Add logo to document - Non-freemium only',
    description: 'Add a logo image to a document. Only available for non-freemium packages. Requires documents.logos permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Logo added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid logo file' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async addLogo(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
    @UploadedFile() logoFile: MulterFile,
  ): Promise<OrganizationDocument> {
    if (!logoFile) {
      throw new Error('Logo file is required');
    }
    return this.documentsService.addLogo(user.userId, organization.id, documentId, logoFile);
  }

  @Post(':id/letterhead-design')
  @Permissions('organizations.edit')
  @ApiOperation({ 
    summary: 'Set letterhead design - Non-freemium only',
    description: 'Set a letterhead design template for a document. Design availability depends on package. Only available for non-freemium packages. Requires documents.designs permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Letterhead design set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid design ID or not available for package' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async setLetterheadDesign(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
    @Query('design_id') designId: string,
    @Query('metadata') metadata?: string,
  ): Promise<OrganizationDocument> {
    if (!designId) {
      throw new Error('Design ID is required');
    }
    const designMetadata = metadata ? JSON.parse(metadata) : undefined;
    return this.documentsService.setLetterheadDesign(
      user.userId,
      organization.id,
      documentId,
      designId,
      designMetadata,
    );
  }

  @Post(':id/invoice-design')
  @Permissions('organizations.edit')
  @ApiOperation({ 
    summary: 'Set invoice design - Non-freemium only',
    description: 'Set an invoice design template for a document. Design availability depends on package. Only available for non-freemium packages. Requires documents.designs permission.'
  })
  @ApiParam({ name: 'id', description: 'Document ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Invoice design set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid design ID or not available for package' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or package restrictions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async setInvoiceDesign(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('id') documentId: string,
    @Query('design_id') designId: string,
    @Query('metadata') metadata?: string,
  ): Promise<OrganizationDocument> {
    if (!designId) {
      throw new Error('Design ID is required');
    }
    const designMetadata = metadata ? JSON.parse(metadata) : undefined;
    return this.documentsService.setInvoiceDesign(
      user.userId,
      organization.id,
      documentId,
      designId,
      designMetadata,
    );
  }

  @Get('letterhead-designs/available')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get available letterhead designs for package' })
  async getAvailableLetterheadDesigns(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<{ designs: string[] }> {
    const designs = await this.documentsService.getAvailableLetterheadDesigns(organization.id);
    return { designs };
  }

  @Get('invoice-designs/available')
  @Permissions('organizations.view')
  @ApiOperation({ summary: 'Get available invoice designs for package' })
  async getAvailableInvoiceDesigns(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<{ designs: string[] }> {
    const designs = await this.documentsService.getAvailableInvoiceDesigns(organization.id);
    return { designs };
  }
}
