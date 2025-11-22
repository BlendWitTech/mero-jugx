import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrganizationDocument,
  DocumentType,
} from '../database/entities/organization-document.entity';
import { Organization } from '../database/entities/organization.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { Role } from '../database/entities/role.entity';
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
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'documents');

  constructor(
    @InjectRepository(OrganizationDocument)
    private documentRepository: Repository<OrganizationDocument>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }

  async getDocuments(userId: string, organizationId: string): Promise<OrganizationDocument[]> {
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

    // Check permission (organizations.view)
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

    return documents;
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

    // Check permission (organizations.edit)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'organizations.edit',
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
      is_active: true,
    });

    return this.documentRepository.save(document);
  }

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

    // Check permission (organizations.edit)
    if (!membership.role.is_organization_owner) {
      const roleWithPermissions = await this.roleRepository.findOne({
        where: { id: membership.role_id },
        relations: ['role_permissions', 'role_permissions.permission'],
      });

      const hasPermission = roleWithPermissions?.role_permissions?.some(
        (rp) => rp.permission.slug === 'organizations.edit',
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
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete document
    await this.documentRepository.softDelete(documentId);

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
