import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Webhook, WebhookStatus, WebhookEvent } from '../database/entities/webhook.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import * as crypto from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private httpService: HttpService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a new webhook
   */
  async createWebhook(
    organizationId: string,
    userId: string,
    name: string,
    description: string | null,
    url: string,
    events: string[],
    secret: string | null,
  ): Promise<Webhook> {
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
      throw new ForbiddenException('You do not have permission to create webhooks');
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    // Validate events
    const validEvents = Object.values(WebhookEvent);
    const invalidEvents = events.filter(e => !validEvents.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      throw new BadRequestException(`Invalid events: ${invalidEvents.join(', ')}`);
    }

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    const webhook = this.webhookRepository.create({
      organization_id: organizationId,
      created_by: userId,
      name,
      description,
      url,
      events,
      secret: webhookSecret,
      status: WebhookStatus.ACTIVE,
    });

    const saved = await this.webhookRepository.save(webhook);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'webhook.created',
      'webhook',
      saved.id,
      null,
      { name, url, events },
    );

    return saved;
  }

  /**
   * List all webhooks for an organization
   */
  async listWebhooks(organizationId: string, userId: string): Promise<Webhook[]> {
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
      throw new ForbiddenException('You do not have permission to view webhooks');
    }

    return this.webhookRepository.find({
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
   * Update a webhook
   */
  async updateWebhook(
    organizationId: string,
    userId: string,
    webhookId: string,
    updates: {
      name?: string;
      description?: string | null;
      url?: string;
      events?: string[];
      status?: WebhookStatus;
      secret?: string | null;
    },
  ): Promise<Webhook> {
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
      throw new ForbiddenException('You do not have permission to update webhooks');
    }

    const webhook = await this.webhookRepository.findOne({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const oldValues = {
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
    };

    if (updates.name !== undefined) webhook.name = updates.name;
    if (updates.description !== undefined) webhook.description = updates.description;
    if (updates.url !== undefined) {
      try {
        new URL(updates.url);
        webhook.url = updates.url;
      } catch {
        throw new BadRequestException('Invalid webhook URL');
      }
    }
    if (updates.events !== undefined) {
      const validEvents = Object.values(WebhookEvent);
      const invalidEvents = updates.events.filter(e => !validEvents.includes(e as WebhookEvent));
      if (invalidEvents.length > 0) {
        throw new BadRequestException(`Invalid events: ${invalidEvents.join(', ')}`);
      }
      webhook.events = updates.events;
    }
    if (updates.status !== undefined) webhook.status = updates.status;
    if (updates.secret !== undefined) webhook.secret = updates.secret;

    const saved = await this.webhookRepository.save(webhook);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'webhook.updated',
      'webhook',
      webhookId,
      oldValues,
      {
        name: saved.name,
        description: saved.description,
        url: saved.url,
        events: saved.events,
        status: saved.status,
      },
    );

    return saved;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(organizationId: string, userId: string, webhookId: string): Promise<void> {
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
      throw new ForbiddenException('You do not have permission to delete webhooks');
    }

    const webhook = await this.webhookRepository.findOne({
      where: {
        id: webhookId,
        organization_id: organizationId,
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.webhookRepository.softDelete(webhookId);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'webhook.deleted',
      'webhook',
      webhookId,
      null,
      null,
    );
  }

  /**
   * Trigger a webhook
   */
  async triggerWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    data: any,
  ): Promise<void> {
    if (webhook.status !== WebhookStatus.ACTIVE) {
      return;
    }

    if (!webhook.events.includes(event)) {
      return;
    }

    // Create payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      organization_id: webhook.organization_id,
      data,
    };

    // Create signature if secret exists
    let signature: string | null = null;
    if (webhook.secret) {
      signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MeroJugx-Webhook/1.0',
    };

    if (signature) {
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers,
          timeout: 10000, // 10 second timeout
        }),
      );

      // Update success stats
      webhook.success_count += 1;
      webhook.last_triggered_at = new Date();
      webhook.last_success_at = new Date();
      webhook.last_error = null;
      await this.webhookRepository.save(webhook);
    } catch (error: any) {
      this.logger.error(`Webhook delivery failed: ${webhook.id}`, error.message);

      // Update failure stats
      webhook.failure_count += 1;
      webhook.last_triggered_at = new Date();
      webhook.last_failure_at = new Date();
      webhook.last_error = error.message || 'Unknown error';

      // Mark as failed if too many failures
      if (webhook.failure_count >= 10) {
        webhook.status = WebhookStatus.FAILED;
      }

      await this.webhookRepository.save(webhook);
    }
  }

  /**
   * Trigger webhooks for an event
   */
  async triggerWebhooksForEvent(
    organizationId: string,
    event: WebhookEvent,
    data: any,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: {
        organization_id: organizationId,
        status: WebhookStatus.ACTIVE,
        deleted_at: null,
      },
    });

    // Trigger all matching webhooks in parallel
    await Promise.allSettled(
      webhooks
        .filter(w => w.events.includes(event))
        .map(webhook => this.triggerWebhook(webhook, event, data)),
    );
  }
}

