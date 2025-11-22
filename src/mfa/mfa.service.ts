import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/services/redis.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { User } from '../database/entities/user.entity';
import { Organization } from '../database/entities/organization.entity';
import {
  OrganizationMember,
  OrganizationMemberStatus,
} from '../database/entities/organization-member.entity';
import { SetupMfaDto } from './dto/setup-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async initializeSetup(
    userId: string,
    organizationId: string,
  ): Promise<{
    secret: string;
    qr_code_url: string;
    otp_url: string;
    temp_setup_token: string;
    user_email: string;
  }> {
    // Verify user is member of organization
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get organization
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if MFA is enabled at organization level
    if (!organization.mfa_enabled) {
      throw new BadRequestException('MFA is not enabled for this organization');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already set up
    if (user.mfa_enabled && user.mfa_setup_completed_at) {
      throw new BadRequestException('2FA is already set up for this user');
    }

    // Generate secret with shortened label to prevent QR code "Data too long" error
    // Use organization name (max 20 chars) and user email (max 30 chars) to keep URL short
    const orgName =
      organization.name.length > 20 ? organization.name.substring(0, 20) : organization.name;
    const userEmail = user.email.length > 30 ? user.email.substring(0, 30) : user.email;
    const label = `${orgName}:${userEmail}`;

    const secret = speakeasy.generateSecret({
      name: label,
      issuer: this.configService.get<string>('APP_NAME', 'Mero Jugx'),
      length: 32,
    });

    // Generate temporary setup token to store secret temporarily
    const tempSetupToken = crypto.randomUUID();
    const backupCodes = this.generateBackupCodes(10);

    // Store secret and backup codes in Redis for 10 minutes
    // CRITICAL: Include user email and label for validation during verification
    // This ensures the QR code can only be verified by the correct user
    await this.redisService.set(
      `mfa:setup:${tempSetupToken}`,
      JSON.stringify({
        secret: secret.base32!,
        backup_codes: backupCodes,
        user_id: userId,
        user_email: user.email.toLowerCase(), // Store email in lowercase for consistent comparison
        organization_id: organizationId,
        otp_label: label, // Store the label to validate email consistency
        expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
      }),
      600, // 10 minutes
    );

    // Generate QR code with error correction level M (15% recovery) to handle longer URLs
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
    });

    return {
      secret: secret.base32!,
      qr_code_url: qrCodeUrl,
      otp_url: secret.otpauth_url!, // Also send the OTP URL for manual entry
      temp_setup_token: tempSetupToken,
      user_email: user.email, // Return email so frontend can display it
    };
  }

  async verifyAndCompleteSetup(
    userId: string,
    organizationId: string,
    dto: SetupMfaDto,
    tempSetupToken: string,
  ): Promise<{ message: string; backup_codes: string[] }> {
    // Get temporary setup data from Redis
    // Check both possible Redis keys (from initializeSetup and from login)
    let setupDataStr = await this.redisService.get(`mfa:setup:${tempSetupToken}`);
    let tokenKey = `mfa:setup:${tempSetupToken}`;

    // If not found, check the login token key
    if (!setupDataStr) {
      setupDataStr = await this.redisService.get(`mfa:setup:temp:${tempSetupToken}`);
      tokenKey = `mfa:setup:temp:${tempSetupToken}`;
    }

    if (!setupDataStr) {
      throw new BadRequestException(
        'Invalid or expired setup token. Please login again to get a new token.',
      );
    }

    const setupData = JSON.parse(setupDataStr);

    // Check if token expired
    if (Date.now() > setupData.expires_at) {
      await this.redisService.del(tokenKey);
      throw new BadRequestException('Setup token expired. Please login again to get a new token.');
    }

    // Verify user matches
    if (setupData.user_id !== userId || setupData.organization_id !== organizationId) {
      throw new ForbiddenException('Invalid setup token for this user');
    }

    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // CRITICAL SECURITY CHECK: Verify that the user email matches what's stored in Redis
    // This ensures the QR code was generated for the correct user
    // Handle both 'email' (from login token) and 'user_email' (from initializeSetup)
    const storedEmail = setupData.user_email || setupData.email;

    // MANDATORY: Email must be stored and must match exactly
    if (!storedEmail) {
      throw new ForbiddenException(
        'Security validation failed: Email information missing. Please login again to generate a new QR code.',
      );
    }

    // MANDATORY: Email must match exactly (case-insensitive comparison)
    if (user.email.toLowerCase() !== storedEmail.toLowerCase()) {
      throw new ForbiddenException(
        `Security validation failed: Email mismatch. ` +
          `The QR code was generated for "${storedEmail}" but you are logged in as "${user.email}". ` +
          `Please logout and login again with the correct email address to set up MFA.`,
      );
    }

    // Additional validation: Ensure the email in the OTP URL label matches
    // Extract email from the label if available (format: "orgName:userEmail")
    // This is a secondary check to ensure consistency
    if (setupData.otp_label) {
      const labelEmail = setupData.otp_label.split(':').pop();
      if (labelEmail && labelEmail.toLowerCase() !== user.email.toLowerCase()) {
        throw new ForbiddenException(
          `Security validation failed: QR code label email mismatch. ` +
            `The QR code contains email "${labelEmail}" but your account email is "${user.email}". ` +
            `Please logout and login again with the correct email address.`,
        );
      }
    }

    // Verify OTP code
    // Ensure code is exactly 6 digits (remove any whitespace or non-numeric characters)
    const cleanCode = dto.code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      throw new BadRequestException('Verification code must be exactly 6 digits');
    }

    const verified = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token: cleanCode,
      window: 2, // Allow 2 time steps before/after (60 seconds tolerance)
    });

    if (!verified) {
      throw new BadRequestException(
        'Invalid verification code. Please make sure you scanned the QR code with the same email address used in this application.',
      );
    }

    // Save MFA setup
    user.mfa_enabled = true;
    user.mfa_secret = setupData.secret;
    user.mfa_backup_codes = setupData.backup_codes;
    user.mfa_setup_completed_at = new Date();

    const savedUser = await this.userRepository.save(user);

    // Delete temporary setup token (from initializeSetup or login)
    await this.redisService.del(tokenKey);

    // Also delete the other token key if it exists (cleanup)
    if (tokenKey === `mfa:setup:${tempSetupToken}`) {
      await this.redisService.del(`mfa:setup:temp:${tempSetupToken}`);
    } else {
      await this.redisService.del(`mfa:setup:${tempSetupToken}`);
    }

    // Also check and delete temporary login token if it exists
    // This is stored when login returns requires_mfa_setup
    const loginTokenKeys = await this.redisService.get(`mfa:setup:temp:*`);
    // Note: Redis doesn't support wildcard get, so we'll handle this differently
    // The login token will expire naturally after 15 minutes

    return {
      message: '2FA setup completed successfully',
      backup_codes: setupData.backup_codes,
    };
  }

  async verifyCode(userId: string, code: string, organizationId?: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Check if code is a backup code
    if (user.mfa_backup_codes && user.mfa_backup_codes.includes(code)) {
      // Remove used backup code
      user.mfa_backup_codes = user.mfa_backup_codes.filter((c) => c !== code);
      await this.userRepository.save(user);
      return true;
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    return verified;
  }

  async getBackupCodes(
    userId: string,
    organizationId: string,
  ): Promise<{
    backup_codes: string[];
    message: string;
  }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    return {
      backup_codes: user.mfa_backup_codes || [],
      message: 'Backup codes retrieved successfully',
    };
  }

  async regenerateBackupCodes(
    userId: string,
    organizationId: string,
    dto: VerifyMfaDto,
  ): Promise<{ backup_codes: string[]; message: string }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Verify code before regenerating
    const verified = await this.verifyCode(userId, dto.code, organizationId);
    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes(10);
    user.mfa_backup_codes = newBackupCodes;
    await this.userRepository.save(user);

    return {
      backup_codes: newBackupCodes,
      message: 'Backup codes regenerated successfully',
    };
  }

  async disableMfa(
    userId: string,
    organizationId: string,
    dto: DisableMfaDto,
  ): Promise<{ message: string }> {
    // Verify user is member
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Verify code before disabling
    const verified = await this.verifyCode(userId, dto.code, organizationId);
    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable MFA
    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_backup_codes = null;
    user.mfa_setup_completed_at = null;

    await this.userRepository.save(user);

    return { message: '2FA disabled successfully' };
  }

  async checkMfaRequired(
    userId: string,
    organizationId: string,
  ): Promise<{ required: boolean; setup_completed: boolean }> {
    const membership = await this.memberRepository.findOne({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: OrganizationMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      return { required: false, setup_completed: false };
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.mfa_enabled) {
      return { required: false, setup_completed: false };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return { required: false, setup_completed: false };
    }

    return {
      required: true,
      setup_completed: user.mfa_enabled && !!user.mfa_setup_completed_at,
    };
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric backup code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
