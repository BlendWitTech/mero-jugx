import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export interface EmailTemplate {
  id?: number;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[]; // List of available variables like {{name}}, {{email}}
}

@Injectable()
export class EmailTemplateService {
  // In-memory storage for now - can be moved to database later
  private templates: Map<string, EmailTemplate> = new Map();

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // This would typically load from database
    // For now, we'll use in-memory storage
  }

  /**
   * Create or update an email template
   */
  async saveTemplate(
    organizationId: string,
    userId: string,
    template: EmailTemplate,
  ): Promise<EmailTemplate> {
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
      membership.role.role_permissions?.some((rp) => rp.permission.slug === 'organizations.settings');
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to manage email templates');
    }

    const key = `${organizationId}:${template.name}`;
    const savedTemplate = {
      ...template,
      id: this.templates.size + 1,
    };

    this.templates.set(key, savedTemplate);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'email_template.saved',
      'email_template',
      String(savedTemplate.id),
      null,
      { name: template.name },
    );

    return savedTemplate;
  }

  /**
   * Get an email template
   */
  async getTemplate(organizationId: string, templateName: string): Promise<EmailTemplate | null> {
    const key = `${organizationId}:${templateName}`;
    return this.templates.get(key) || null;
  }

  /**
   * List all templates for an organization
   */
  async listTemplates(organizationId: string, userId: string): Promise<EmailTemplate[]> {
    // Verify user has permission
    const membership = await this.memberRepository.findOne({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['role'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const templates: EmailTemplate[] = [];
    for (const [key, template] of this.templates.entries()) {
      if (key.startsWith(`${organizationId}:`)) {
        templates.push(template);
      }
    }

    return templates;
  }

  /**
   * Render template with variables
   */
  renderTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; html: string; text?: string } {
    let subject = template.subject;
    let html = template.html_content;
    let text = template.text_content;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      if (text) {
        text = text.replace(regex, value);
      }
    });

    return { subject, html, text };
  }
}

