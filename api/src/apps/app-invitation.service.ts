import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppInvitation, AppInvitationStatus } from '../database/entities/app_invitations.entity';
import { App } from '../database/entities/apps.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { CreateAppInvitationDto } from './dto/create-app-invitation.dto';
import { AcceptAppInvitationDto } from './dto/accept-app-invitation.dto';
import { NotificationHelperService, NotificationType } from '../notifications/notification-helper.service';
import { AppAccessService } from './app-access.service';
import * as crypto from 'crypto';

@Injectable()
export class AppInvitationService {
  constructor(
    @InjectRepository(AppInvitation)
    private invitationRepository: Repository<AppInvitation>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationHelper: NotificationHelperService,
    private appAccessService: AppAccessService,
  ) {}

  /**
   * Create an app invitation for an existing organization member
   */
  async createInvitation(
    userId: string,
    organizationId: string,
    dto: CreateAppInvitationDto,
  ): Promise<AppInvitation> {
    // Verify app exists
    const app = await this.appRepository.findOne({
      where: { id: dto.app_id },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    // Verify user is a member of the organization
    const inviterMember = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!inviterMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Verify target user is a member of the organization
    const targetMember = await this.memberRepository.findOne({
      where: {
        user_id: dto.user_id,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user'],
    });

    if (!targetMember) {
      throw new NotFoundException('User is not a member of this organization');
    }

    // Check if user already has access to this app
    const existingAccess = await this.appAccessService.hasAccess(
      dto.user_id,
      organizationId,
      dto.app_id,
    );

    if (existingAccess) {
      throw new ConflictException('User already has access to this app');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        organization_id: organizationId,
        app_id: dto.app_id,
        user_id: dto.user_id,
        status: AppInvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      if (existingInvitation.isExpired()) {
        // Mark as expired and create new one
        existingInvitation.status = AppInvitationStatus.EXPIRED;
        await this.invitationRepository.save(existingInvitation);
      } else {
        throw new ConflictException('User already has a pending invitation for this app');
      }
    }

    // Create invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = this.invitationRepository.create({
      organization_id: organizationId,
      app_id: dto.app_id,
      user_id: dto.user_id,
      member_id: targetMember.id,
      invited_by: userId,
      token,
      status: AppInvitationStatus.PENDING,
      expires_at: expiresAt,
      message: dto.message || null,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Send notification to the invited user
    const inviter = await this.userRepository.findOne({ where: { id: userId } });
    const inviterName = inviter ? `${inviter.first_name} ${inviter.last_name}` : 'Someone';
    const organization = await this.organizationRepository.findOne({ where: { id: organizationId } });

    await this.notificationHelper.createNotification(
      dto.user_id,
      organizationId,
      NotificationType.APP_INVITATION,
      `Invitation to ${app.name}`,
      `${inviterName} invited you to use ${app.name} in ${organization?.name || 'the organization'}`,
      {
        route: '/apps/invitations',
        params: { token: savedInvitation.token },
      },
      {
        invitation_id: savedInvitation.id,
        app_id: dto.app_id,
        app_name: app.name,
        inviter_id: userId,
        inviter_name: inviterName,
        organization_id: organizationId,
        organization_name: organization?.name,
      },
    );

    return savedInvitation;
  }

  /**
   * Get invitations for a user
   */
  async getInvitations(
    userId: string,
    organizationId: string,
  ): Promise<AppInvitation[]> {
    // Verify user is a member
    const member = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const invitations = await this.invitationRepository.find({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
      relations: ['app', 'organization', 'inviter'],
      order: { created_at: 'DESC' },
    });

    // Include token in response for pending invitations (needed for acceptance)
    return invitations.map((inv) => {
      const invitation = Object.assign(new AppInvitation(), {
        ...inv,
        token: inv.status === 'pending' ? inv.token : undefined, // Only include token for pending
      });
      return invitation;
    });
  }

  /**
   * Get invitation by ID (for current user)
   */
  async getInvitationById(
    userId: string,
    invitationId: string,
  ): Promise<AppInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['app', 'organization', 'inviter'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.user_id !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    return invitation;
  }

  /**
   * Accept an app invitation
   */
  async acceptInvitation(
    userId: string,
    token: string,
    dto: AcceptAppInvitationDto,
  ): Promise<AppInvitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['app', 'organization', 'user'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.user_id !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== AppInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    if (invitation.isExpired()) {
      invitation.status = AppInvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Grant app access
    await this.appAccessService.grantAccess(
      invitation.invited_by,
      invitation.organization_id,
      {
        user_id: userId,
        app_id: invitation.app_id,
      },
    );

    // Update invitation status
    invitation.status = AppInvitationStatus.ACCEPTED;
    invitation.accepted_at = new Date();
    await this.invitationRepository.save(invitation);

    return invitation;
  }

  /**
   * Decline an app invitation
   */
  async declineInvitation(
    userId: string,
    invitationId: string,
  ): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.user_id !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (invitation.status !== AppInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    invitation.status = AppInvitationStatus.DECLINED;
    invitation.declined_at = new Date();
    await this.invitationRepository.save(invitation);
  }

  /**
   * Cancel an app invitation (by inviter)
   */
  async cancelInvitation(
    userId: string,
    organizationId: string,
    invitationId: string,
  ): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.organization_id !== organizationId) {
      throw new ForbiddenException('Invitation does not belong to this organization');
    }

    if (invitation.invited_by !== userId) {
      throw new ForbiddenException('You did not create this invitation');
    }

    if (invitation.status !== AppInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is not pending');
    }

    invitation.status = AppInvitationStatus.CANCELLED;
    invitation.cancelled_by = userId;
    await this.invitationRepository.save(invitation);
  }
}

