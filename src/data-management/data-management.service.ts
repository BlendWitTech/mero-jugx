import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { User } from '../database/entities/users.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization_members.entity';
import { Role } from '../database/entities/roles.entity';
import { Invitation, InvitationStatus } from '../database/entities/invitations.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DataManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Export users to CSV
   */
  async exportUsers(organizationId: string, userId: string): Promise<string> {
    const members = await this.memberRepository.find({
      where: {
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
      relations: ['user', 'role'],
    });

    // CSV header
    const headers = ['Email', 'First Name', 'Last Name', 'Phone', 'Role', 'Joined At', 'Status'];
    const rows = members.map(member => [
      member.user?.email || '',
      member.user?.first_name || '',
      member.user?.last_name || '',
      member.user?.phone || '',
      member.role?.name || '',
      member.joined_at?.toISOString() || '',
      member.status,
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Log export action
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'data.export_users',
      'user',
      null,
      null,
      { format: 'csv', count: members.length },
    );

    return csvContent;
  }

  /**
   * Import users from CSV
   */
  async importUsers(
    organizationId: string,
    userId: string,
    csvData: string,
    roleId: number,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Expected headers: Email, First Name, Last Name, Phone (optional)
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('first'));
    const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('last'));
    const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));

    if (emailIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
      throw new Error('CSV must contain Email, First Name, and Last Name columns');
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      try {
        const email = values[emailIndex];
        const firstName = values[firstNameIndex];
        const lastName = values[lastNameIndex];
        const phone = phoneIndex >= 0 ? values[phoneIndex] : '';

        if (!email || !firstName || !lastName) {
          failed++;
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if user exists
        let user = await this.userRepository.findOne({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          // Create new user (without password - they'll need to set it)
          user = this.userRepository.create({
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            email_verified: false,
          });
          user = await this.userRepository.save(user);
        }

        // Check if already a member
        const existingMember = await this.memberRepository.findOne({
          where: {
            organization_id: organizationId,
            user_id: user.id,
          },
        });

        if (existingMember) {
          failed++;
          errors.push(`Row ${i + 1}: User ${email} is already a member`);
          continue;
        }

        // Create membership
        const member = this.memberRepository.create({
          organization_id: organizationId,
          user_id: user.id,
          role_id: roleId,
          invited_by: userId,
          status: OrganizationMemberStatus.ACTIVE,
          joined_at: new Date(),
        });

        await this.memberRepository.save(member);
        success++;

        // Log action
        await this.auditLogsService.createAuditLog(
          organizationId,
          userId,
          'data.import_user',
          'user',
          user.id,
          null,
          { email, source: 'csv_import' },
        );
      } catch (error: any) {
        failed++;
        errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    // Log bulk import
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'data.import_users',
      'user',
      null,
      null,
      { format: 'csv', success, failed, total: lines.length - 1 },
    );

    return { success, failed, errors };
  }

  /**
   * Bulk assign role to users
   */
  async bulkAssignRole(
    organizationId: string,
    userId: string,
    userIds: string[],
    roleId: number,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const targetUserId of userIds) {
      try {
        const member = await this.memberRepository.findOne({
          where: {
            organization_id: organizationId,
            user_id: targetUserId,
            status: OrganizationMemberStatus.ACTIVE,
          },
        });

        if (!member) {
          failed++;
          continue;
        }

        member.role_id = roleId;
        await this.memberRepository.save(member);
        success++;

        await this.auditLogsService.createAuditLog(
          organizationId,
          userId,
          'data.bulk_assign_role',
          'user',
          targetUserId,
          { role_id: member.role_id },
          { role_id: roleId },
        );
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Bulk send invitations
   */
  async bulkSendInvitations(
    organizationId: string,
    userId: string,
    emails: string[],
    roleId: number,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        // Check if already a member
        const existingUser = await this.userRepository.findOne({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          const existingMember = await this.memberRepository.findOne({
            where: {
              organization_id: organizationId,
              user_id: existingUser.id,
            },
          });

          if (existingMember) {
            failed++;
            errors.push(`${email}: Already a member`);
            continue;
          }
        }

        // Check for existing pending invitation
        const existingInvitation = await this.invitationRepository.findOne({
          where: {
            organization_id: organizationId,
            email: email.toLowerCase(),
            status: InvitationStatus.PENDING,
          },
        });

        if (existingInvitation) {
          failed++;
          errors.push(`${email}: Invitation already sent`);
          continue;
        }

        // Create invitation (this would typically trigger email sending)
        // For now, just create the invitation record
        const invitation = this.invitationRepository.create({
          organization_id: organizationId,
          email: email.toLowerCase(),
          role_id: roleId,
          invited_by: userId,
          status: InvitationStatus.PENDING,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        await this.invitationRepository.save(invitation);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`${email}: ${error.message || 'Unknown error'}`);
      }
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'data.bulk_send_invitations',
      'invitation',
      null,
      null,
      { count: emails.length, success, failed },
    );

    return { success, failed, errors };
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    organizationId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    // This would use the audit logs service to get logs and format as CSV
    // For now, return a placeholder
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
    
    // Log export
    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'data.export_audit_logs',
      'audit_log',
      null,
      null,
      { format: 'csv', startDate, endDate },
    );

    return headers.join(',') + '\n'; // Placeholder
  }
}

