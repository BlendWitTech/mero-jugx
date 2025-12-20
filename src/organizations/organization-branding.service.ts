import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export interface BrandingSettings {
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  custom_css?: string | null;
  custom_js?: string | null;
  footer_text?: string | null;
}

@Injectable()
export class OrganizationBrandingService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Update organization branding
   */
  async updateBranding(
    organizationId: string,
    userId: string,
    branding: BrandingSettings,
  ): Promise<Organization> {
    // Verify user is owner
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

    if (!membership.role.is_organization_owner) {
      throw new ForbiddenException('Only organization owner can update branding');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const oldBranding = {
      logo_url: organization.logo_url,
      favicon_url: organization.favicon_url,
      primary_color: organization.primary_color,
      secondary_color: organization.secondary_color,
      custom_css: organization.custom_css,
      custom_js: organization.custom_js,
      footer_text: organization.footer_text,
    };

    // Update branding fields
    if (branding.logo_url !== undefined) organization.logo_url = branding.logo_url;
    if (branding.favicon_url !== undefined) organization.favicon_url = branding.favicon_url;
    if (branding.primary_color !== undefined) organization.primary_color = branding.primary_color;
    if (branding.secondary_color !== undefined) organization.secondary_color = branding.secondary_color;
    if (branding.custom_css !== undefined) organization.custom_css = branding.custom_css;
    if (branding.custom_js !== undefined) organization.custom_js = branding.custom_js;
    if (branding.footer_text !== undefined) organization.footer_text = branding.footer_text;

    const saved = await this.organizationRepository.save(organization);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'organization.branding_updated',
      'organization',
      organizationId,
      oldBranding,
      {
        logo_url: saved.logo_url,
        favicon_url: saved.favicon_url,
        primary_color: saved.primary_color,
        secondary_color: saved.secondary_color,
        has_custom_css: !!saved.custom_css,
        has_custom_js: !!saved.custom_js,
        footer_text: saved.footer_text,
      },
    );

    return saved;
  }

  /**
   * Get organization branding
   */
  async getBranding(organizationId: string): Promise<BrandingSettings> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: [
        'id',
        'logo_url',
        'favicon_url',
        'primary_color',
        'secondary_color',
        'custom_css',
        'custom_js',
        'footer_text',
      ],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      logo_url: organization.logo_url,
      favicon_url: organization.favicon_url,
      primary_color: organization.primary_color,
      secondary_color: organization.secondary_color,
      custom_css: organization.custom_css,
      custom_js: organization.custom_js,
      footer_text: organization.footer_text,
    };
  }
}

