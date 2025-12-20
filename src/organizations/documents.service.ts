import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrganizationDocument,
  DocumentType,
} from '../database/entities/organization_documents.entity';
import { Organization } from '../database/entities/organizations.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { Package } from '../database/entities/packages.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

// Type definition for uploaded file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
  
  // File upload security settings
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ];

  constructor(
    @InjectRepository(OrganizationDocument)
    private documentRepository: Repository<OrganizationDocument>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Package)
    private packageRepository: Repository<Package>,
  ) {
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
  }

  /**
   * Check if organization has access to advanced document features
   * Freemium: Only upload and view
   * Other packages: Full features (scan, design, signature, logo)
   */
  private async hasAdvancedDocumentFeatures(organizationId: string): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization || !organization.package) {
      return false;
    }

    // Freemium can only upload and view
    return organization.package.slug !== 'freemium';
  }

  // Cache for design availability (package-based, changes infrequently)
  private letterheadDesignsCache = new Map<string, { designs: string[]; timestamp: number }>();
  private invoiceDesignsCache = new Map<string, { designs: string[]; timestamp: number }>();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get available letterhead designs based on package
   * Results are cached for 1 hour to reduce database queries
   * @param organizationId - Organization ID
   * @returns Array of available design IDs
   */
  async getAvailableLetterheadDesigns(organizationId: string): Promise<string[]> {
    // Check cache first
    const cached = this.letterheadDesignsCache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Returning cached letterhead designs for organization ${organizationId}`);
      return cached.designs;
    }

    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      return []; // Freemium has no designs
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization?.package) {
      return [];
    }

    // Design availability based on package
    const designsByPackage: Record<string, string[]> = {
      basic: ['design-1', 'design-2', 'design-3'],
      premium: ['design-1', 'design-2', 'design-3', 'design-4', 'design-5', 'design-6'],
      platinum: ['design-1', 'design-2', 'design-3', 'design-4', 'design-5', 'design-6', 'design-7', 'design-8', 'design-9', 'design-10'],
      diamond: ['design-1', 'design-2', 'design-3', 'design-4', 'design-5', 'design-6', 'design-7', 'design-8', 'design-9', 'design-10', 'design-11', 'design-12', 'design-13', 'design-14', 'design-15'],
    };

    const designs = designsByPackage[organization.package.slug] || designsByPackage.basic;
    
    // Cache the result
    this.letterheadDesignsCache.set(organizationId, {
      designs,
      timestamp: Date.now(),
    });

    return designs;
  }

  /**
   * Get available invoice designs based on package
   * Results are cached for 1 hour to reduce database queries
   * @param organizationId - Organization ID
   * @returns Array of available design IDs
   */
  async getAvailableInvoiceDesigns(organizationId: string): Promise<string[]> {
    // Check cache first
    const cached = this.invoiceDesignsCache.get(organizationId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Returning cached invoice designs for organization ${organizationId}`);
      return cached.designs;
    }

    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      return []; // Freemium has no designs
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['package'],
    });

    if (!organization?.package) {
      return [];
    }

    // Design availability based on package
    const designsByPackage: Record<string, string[]> = {
      basic: ['invoice-1', 'invoice-2', 'invoice-3'],
      premium: ['invoice-1', 'invoice-2', 'invoice-3', 'invoice-4', 'invoice-5', 'invoice-6'],
      platinum: ['invoice-1', 'invoice-2', 'invoice-3', 'invoice-4', 'invoice-5', 'invoice-6', 'invoice-7', 'invoice-8', 'invoice-9', 'invoice-10'],
      diamond: ['invoice-1', 'invoice-2', 'invoice-3', 'invoice-4', 'invoice-5', 'invoice-6', 'invoice-7', 'invoice-8', 'invoice-9', 'invoice-10', 'invoice-11', 'invoice-12', 'invoice-13', 'invoice-14', 'invoice-15'],
    };

    const designs = designsByPackage[organization.package.slug] || designsByPackage.basic;
    
    // Cache the result
    this.invoiceDesignsCache.set(organizationId, {
      designs,
      timestamp: Date.now(),
    });

    return designs;
  }

  /**
   * Clear design cache for an organization (useful when package changes)
   * @param organizationId - Organization ID
   */
  clearDesignCache(organizationId: string): void {
    this.letterheadDesignsCache.delete(organizationId);
    this.invoiceDesignsCache.delete(organizationId);
    this.logger.debug(`Cleared design cache for organization ${organizationId}`);
  }

  /**
   * Ensure uploads directory exists
   * @private
   */
  private async ensureUploadsDirectory() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      this.logger.debug(`Uploads directory ensured: ${this.uploadsDir}`);
    } catch (error) {
      this.logger.error('Failed to create uploads directory', error);
      throw new Error('Failed to initialize document storage');
    }
  }

  /**
   * Validate uploaded file
   * @param file - The uploaded file
   * @throws BadRequestException if file is invalid
   */
  private validateFile(file: MulterFile): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`,
      );
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`File extension ${ext} is not allowed`);
    }
  }

  /**
   * Get all documents for an organization
   * @param userId - User ID requesting documents
   * @param organizationId - Organization ID
   * @returns Array of documents
   * @throws ForbiddenException if user lacks permission
   */
  async getDocuments(userId: string, organizationId: string): Promise<OrganizationDocument[]> {
    try {
      // Verify user is member
      const membership = await this.memberRepository.findOne({
        where: {
          user_id: userId,
          organization_id: organizationId,
          status: OrganizationMemberStatus.ACTIVE,
        },
        relations: ['role'],
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this organization');
      }

      // Check permission (documents.view or organizations.view)
      if (!membership.role?.is_organization_owner) {
        const roleId = membership.role_id || membership.role?.id;
        if (!roleId) {
          this.logger.warn(`Role ID not found for membership ${membership.id}`);
          throw new ForbiddenException('Unable to verify permissions');
        }

        const roleWithPermissions = await this.roleRepository.findOne({
          where: { id: roleId },
          relations: ['role_permissions', 'role_permissions.permission'],
        });

        const hasPermission = roleWithPermissions?.role_permissions?.some(
          (rp) => rp.permission.slug === 'documents.view' || rp.permission.slug === 'organizations.view',
        );

        if (!hasPermission) {
          throw new ForbiddenException('You do not have permission to view documents');
        }
      }

      // Get documents
      const documents = await this.documentRepository.find({
        where: {
          organization_id: organizationId,
          is_active: true,
        },
        order: {
          created_at: 'DESC',
        },
      });

      this.logger.debug(`Retrieved ${documents.length} documents for organization ${organizationId}`);
      return documents;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error getting documents for organization ${organizationId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve documents');
    }
  }

  async getDocumentById(
    userId: string,
    organizationId: string,
    documentId: string,
  ): Promise<OrganizationDocument> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'organizations.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view documents');
      }
    }

    // Get document
    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async createDocument(
    userId: string,
    organizationId: string,
    file: MulterFile,
    documentType: DocumentType,
    title?: string,
    description?: string,
  ): Promise<OrganizationDocument> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.upload or organizations.edit)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.upload' || rp.permission.slug === 'organizations.edit',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to upload documents');
      }
    }

    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${organizationId}_${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(this.uploadsDir, fileName);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Check package restrictions for advanced features
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    
    // Freemium can only upload basic documents (not letterhead/invoice templates)
    if (!hasAdvanced && (documentType === DocumentType.LETTERHEAD || documentType === DocumentType.INVOICE_TEMPLATE)) {
      throw new ForbiddenException(
        'Letterhead and invoice template creation is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    // Create document record
    const document = this.documentRepository.create({
      organization_id: organizationId,
      file_name: file.originalname,
      file_path: filePath,
      file_type: file.mimetype,
      file_size: file.size,
      document_type: documentType,
      title: title || file.originalname,
      description,
      created_by: userId,
      is_active: true,
      is_scanned: false, // Will be set to true if scanned
      has_signature: false,
      has_logo: false,
      is_template: documentType === DocumentType.LETTERHEAD || documentType === DocumentType.INVOICE_TEMPLATE,
    });

    return this.documentRepository.save(document);
  }

  /**
   * Scan a document (OCR functionality - placeholder for future implementation)
   * Only available for non-freemium packages
   */
  async scanDocument(
    userId: string,
    organizationId: string,
    documentId: string,
  ): Promise<OrganizationDocument> {
    // Verify user is member and has permission
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.scan)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.scan',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to scan documents');
      }
    }

    // Check if advanced features are available
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      throw new ForbiddenException(
        'Document scanning is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    const document = await this.getDocumentById(userId, organizationId, documentId);

    try {
      // TODO: Implement OCR scanning here
      // For now, we'll just mark it as scanned
      // Future implementation could use:
      // - Tesseract.js for client-side OCR
      // - Google Cloud Vision API
      // - AWS Textract
      // - Azure Computer Vision
      
      document.is_scanned = true;
      document.scan_metadata = {
        scanned_at: new Date().toISOString(),
        scanned_by: userId,
        // OCR results would go here
        ocr_text: null, // Placeholder for OCR text extraction
        confidence: null, // Placeholder for OCR confidence score
        status: 'pending', // Status: pending, processing, completed, failed
      };

      const savedDocument = await this.documentRepository.save(document);
      this.logger.log(`Document scanned: ${documentId} by user ${userId}`);
      
      return savedDocument;
    } catch (error) {
      this.logger.error(`Error scanning document ${documentId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to scan document');
    }
  }

  /**
   * Add signature to a document
   * Only available for non-freemium packages
   * 
   * @param userId - User ID adding the signature
   * @param organizationId - Organization ID
   * @param documentId - Document ID
   * @param signatureFile - Signature image file
   * @returns Updated document with signature
   * @throws ForbiddenException if user lacks permission or package doesn't support signatures
   * @throws NotFoundException if document not found
   * @throws BadRequestException if signature file is invalid
   */
  async addSignature(
    userId: string,
    organizationId: string,
    documentId: string,
    signatureFile: MulterFile,
  ): Promise<OrganizationDocument> {
    // Verify user is member and has permission
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.signatures)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.signatures',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to add signatures to documents');
      }
    }

    // Check if advanced features are available
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      throw new ForbiddenException(
        'Adding signatures to documents is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    const document = await this.getDocumentById(userId, organizationId, documentId);

    // Save signature file
    const timestamp = Date.now();
    const signatureFileName = `signature_${documentId}_${timestamp}_${signatureFile.originalname}`;
    const signaturePath = path.join(this.uploadsDir, 'signatures', signatureFileName);
    
    // Ensure signatures directory exists
    await fs.mkdir(path.dirname(signaturePath), { recursive: true });
    await fs.writeFile(signaturePath, signatureFile.buffer);

    document.has_signature = true;
    document.signature_url = `/uploads/documents/signatures/${signatureFileName}`;

    return this.documentRepository.save(document);
  }

  /**
   * Add logo to a document
   * Only available for non-freemium packages
   * 
   * @param userId - User ID adding the logo
   * @param organizationId - Organization ID
   * @param documentId - Document ID
   * @param logoFile - Logo image file
   * @returns Updated document with logo
   * @throws ForbiddenException if user lacks permission or package doesn't support logos
   * @throws NotFoundException if document not found
   * @throws BadRequestException if logo file is invalid
   */
  async addLogo(
    userId: string,
    organizationId: string,
    documentId: string,
    logoFile: MulterFile,
  ): Promise<OrganizationDocument> {
    // Verify user is member and has permission
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.logos)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.logos',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to add logos to documents');
      }
    }

    // Check if advanced features are available
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      throw new ForbiddenException(
        'Adding logos to documents is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    const document = await this.getDocumentById(userId, organizationId, documentId);

    // Save logo file
    const timestamp = Date.now();
    const logoFileName = `logo_${documentId}_${timestamp}_${logoFile.originalname}`;
    const logoPath = path.join(this.uploadsDir, 'logos', logoFileName);
    
    // Ensure logos directory exists
    await fs.mkdir(path.dirname(logoPath), { recursive: true });
    await fs.writeFile(logoPath, logoFile.buffer);

    document.has_logo = true;
    document.logo_url = `/uploads/documents/logos/${logoFileName}`;

    return this.documentRepository.save(document);
  }

  /**
   * Set letterhead design for a document
   * Only available for non-freemium packages
   * 
   * @param userId - User ID setting the design
   * @param organizationId - Organization ID
   * @param documentId - Document ID
   * @param designId - Design template ID
   * @param designMetadata - Optional design configuration metadata
   * @returns Updated document with letterhead design
   * @throws ForbiddenException if user lacks permission or package doesn't support designs
   * @throws BadRequestException if design is not available for package
   * @throws NotFoundException if document not found
   */
  async setLetterheadDesign(
    userId: string,
    organizationId: string,
    documentId: string,
    designId: string,
    designMetadata?: Record<string, any>,
  ): Promise<OrganizationDocument> {
    // Verify user is member and has permission
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.designs)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.designs',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to manage document designs');
      }
    }

    // Check if advanced features are available
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      throw new ForbiddenException(
        'Letterhead design is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    // Verify design is available for this package
    const availableDesigns = await this.getAvailableLetterheadDesigns(organizationId);
    if (!availableDesigns.includes(designId)) {
      throw new BadRequestException(
        `Design "${designId}" is not available for your package. Available designs: ${availableDesigns.join(', ')}`,
      );
    }

    const document = await this.getDocumentById(userId, organizationId, documentId);
    document.letterhead_design_id = designId;
    document.design_metadata = designMetadata || {};

    return this.documentRepository.save(document);
  }

  /**
   * Set invoice design for a document
   * Only available for non-freemium packages
   * 
   * @param userId - User ID setting the design
   * @param organizationId - Organization ID
   * @param documentId - Document ID
   * @param designId - Design template ID
   * @param designMetadata - Optional design configuration metadata
   * @returns Updated document with invoice design
   * @throws ForbiddenException if user lacks permission or package doesn't support designs
   * @throws BadRequestException if design is not available for package
   * @throws NotFoundException if document not found
   */
  async setInvoiceDesign(
    userId: string,
    organizationId: string,
    documentId: string,
    designId: string,
    designMetadata?: Record<string, any>,
  ): Promise<OrganizationDocument> {
    // Verify user is member and has permission
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.designs)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.designs',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to manage document designs');
      }
    }

    // Check if advanced features are available
    const hasAdvanced = await this.hasAdvancedDocumentFeatures(organizationId);
    if (!hasAdvanced) {
      throw new ForbiddenException(
        'Invoice design is only available for non-freemium packages. Please upgrade to access this feature.',
      );
    }

    // Verify design is available for this package
    const availableDesigns = await this.getAvailableInvoiceDesigns(organizationId);
    if (!availableDesigns.includes(designId)) {
      throw new BadRequestException(
        `Design "${designId}" is not available for your package. Available designs: ${availableDesigns.join(', ')}`,
      );
    }

    const document = await this.getDocumentById(userId, organizationId, documentId);
    document.invoice_design_id = designId;
    document.design_metadata = designMetadata || {};

    return this.documentRepository.save(document);
  }

  /**
   * Delete a document
   * @param userId - User ID deleting the document
   * @param organizationId - Organization ID
   * @param documentId - Document ID to delete
   * @returns Success message
   * @throws ForbiddenException if user lacks permission
   * @throws NotFoundException if document not found
   */
  async deleteDocument(
    userId: string,
    organizationId: string,
    documentId: string,
  ): Promise<{ message: string }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission (documents.delete or organizations.edit)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'documents.delete' || rp.permission.slug === 'organizations.edit',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to delete documents');
      }
    }

    // Get document
    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.file_path);
      this.logger.debug(`Document file deleted: ${document.file_path}`);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${document.file_path}: ${error.message}`);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete document
    await this.documentRepository.softDelete(documentId);
    this.logger.log(`Document deleted: ${documentId} by user ${userId} in organization ${organizationId}`);

    return { message: 'Document deleted successfully' };
  }

  async getDocumentFile(
    userId: string,
    organizationId: string,
    documentId: string,
  ): Promise<{ filePath: string; fileName: string; mimeType: string | null }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Check permission
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'organizations.view',
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view documents');
      }
    }

    // Get document
    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        organization_id: organizationId,
        is_active: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch (error) {
      throw new NotFoundException('Document file not found on server');
    }

    return {
      filePath: document.file_path,
      fileName: document.file_name,
      mimeType: document.file_type,
    };
  }
}
