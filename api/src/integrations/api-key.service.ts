import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus } from '../database/entities/api_keys.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import * as crypto from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Generate a new API key
   */
  generateApiKey(): { key: string; hash: string; prefix: string } {
    // Generate a secure random key
    const key = `mjx_${crypto.randomBytes(32).toString('hex')}`;
    
    // Hash the key for storage
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    // Create a prefix for display (first 20 chars)
    const prefix = key.substring(0, 20) + '...';

    return { key, hash, prefix };
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    organizationId: string,
    userId: string,
    name: string,
    description: string | null,
    permissions: string[] | null,
    expiresAt: Date | null,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Only owners and admins can create API keys
    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'integrations.manage');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to create API keys');
    }

    // Generate API key
    const { key, hash, prefix } = this.generateApiKey();

    // Create API key record
    const apiKey = this.apiKeyRepository.create({
      organization_id: organizationId,
      created_by: userId,
      name,
      description,
      key_hash: hash,
      key_prefix: prefix,
      status: ApiKeyStatus.ACTIVE,
      expires_at: expiresAt,
      permissions,
    });

    const saved = await this.apiKeyRepository.save(apiKey);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'api_key.created',
      'api_key',
      saved.id,
      null,
      { name, has_permissions: !!permissions, expires_at: expiresAt },
    );

    return { apiKey: saved, key };
  }

  /**
   * List all API keys for an organization
   */
  async listApiKeys(organizationId: string, userId: string): Promise<ApiKey[]> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'integrations.view');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to view API keys');
    }

    return this.apiKeyRepository.find({
      where: {
        organization_id: organizationId,
        deleted_at: null,
      },
      relations: ['creator'],
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(organizationId: string, userId: string, apiKeyId: string): Promise<void> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'integrations.manage');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to revoke API keys');
    }

    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        id: apiKeyId,
        organization_id: organizationId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepository.save(apiKey);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'api_key.revoked',
      'api_key',
      apiKeyId,
      { status: apiKey.status },
      { status: ApiKeyStatus.REVOKED },
    );
  }

  /**
   * Verify an API key
   */
  async verifyApiKey(apiKey: string): Promise<ApiKey | null> {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const key = await this.apiKeyRepository.findOne({
      where: {
        key_hash: hash,
        status: ApiKeyStatus.ACTIVE,
        deleted_at: null,
      },
      relations: ['organization'],
    });

    if (!key) {
      return null;
    }

    // Check expiration
    if (key.expires_at && key.expires_at < new Date()) {
      return null;
    }

    // Update last used
    key.last_used_at = new Date();
    await this.apiKeyRepository.save(key);

    return key;
  }

  /**
   * Update API key
   */
  async updateApiKey(
    organizationId: string,
    userId: string,
    apiKeyId: string,
    updates: {
      name?: string;
      description?: string | null;
      status?: ApiKeyStatus;
      permissions?: string[] | null;
      expires_at?: Date | null;
    },
  ): Promise<ApiKey> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const hasPermission = membership.role.is_organization_owner || 
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'integrations.manage');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update API keys');
    }

    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        id: apiKeyId,
        organization_id: organizationId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const oldValues = {
      name: apiKey.name,
      description: apiKey.description,
      status: apiKey.status,
      permissions: apiKey.permissions,
      expires_at: apiKey.expires_at,
    };

    if (updates.name !== undefined) apiKey.name = updates.name;
    if (updates.description !== undefined) apiKey.description = updates.description;
    if (updates.status !== undefined) apiKey.status = updates.status;
    if (updates.permissions !== undefined) apiKey.permissions = updates.permissions;
    if (updates.expires_at !== undefined) apiKey.expires_at = updates.expires_at;

    const saved = await this.apiKeyRepository.save(apiKey);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'api_key.updated',
      'api_key',
      apiKeyId,
      oldValues,
      {
        name: saved.name,
        description: saved.description,
        status: saved.status,
        permissions: saved.permissions,
        expires_at: saved.expires_at,
      },
    );

    return saved;
  }
}

