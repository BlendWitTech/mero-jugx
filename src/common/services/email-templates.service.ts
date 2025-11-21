import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplatesService {
  constructor(private configService: ConfigService) {}

  getBaseTemplate(content: string, title?: string): string {
    const appName = this.configService.get<string>('APP_NAME', 'Mero Jugx');
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title || appName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
              font-size: 24px;
            }
            .content {
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .link {
              color: #2563eb;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getVerificationEmail(name: string, token: string): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    const content = `
      <h2>Welcome! Please Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining us! To complete your registration, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p><a href="${verificationUrl}" class="link">${verificationUrl}</a></p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    return this.getBaseTemplate(content, 'Verify Your Email');
  }

  getPasswordResetEmail(name: string, token: string): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `;

    return this.getBaseTemplate(content, 'Reset Your Password');
  }

  getInvitationEmail(
    inviterName: string,
    organizationName: string,
    token: string,
    isNewUser: boolean,
  ): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const invitationUrl = isNewUser
      ? `${appUrl}/accept-invitation?token=${token}`
      : `${appUrl}/invitations?token=${token}`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <path d="M20 8v6M23 11h-6"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">You've Been Invited!</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Join ${organizationName} today</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello,</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;"><strong style="color: #1e293b;">${inviterName}</strong> has invited you to join the organization <strong style="color: #2563eb;">${organizationName}</strong>.</p>
      
      ${isNewUser ? `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b; box-shadow: 0 2px 4px rgba(245,158,11,0.1);">
        <div style="display: flex; align-items: start;">
          <div style="background: #f59e0b; padding: 8px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 15px; margin-bottom: 5px;">New User Notice</p>
            <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">Since you're new to our platform, you'll need to create an account first. Don't worry, it only takes a minute!</p>
          </div>
        </div>
      </div>
      ` : ''}
      
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Organization Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; width: 40%;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Invited By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${inviterName}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${invitationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139,92,246,0.3);">${isNewUser ? 'Accept Invitation & Sign Up' : 'Accept Invitation'}</a>
      </div>
      
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
          <strong>Or copy and paste this URL into your browser:</strong><br>
          <a href="${invitationUrl}" style="color: #8b5cf6; word-break: break-all; font-size: 12px;">${invitationUrl}</a>
        </p>
        <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
          ⏰ This invitation will expire in <strong>3 days</strong>
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Not interested?</strong><br>
          If you don't want to join this organization, you can safely ignore this email. No action is required.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Organization Invitation');
  }

  getAccessRevokedEmail(name: string, organizationName: string, reason?: string): string {
    const content = `
      <h2>Access Revoked</h2>
      <p>Hi ${name},</p>
      <p>Your access to <strong>${organizationName}</strong> has been revoked.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is an error, please contact your organization administrator.</p>
    `;

    return this.getBaseTemplate(content, 'Access Revoked');
  }

  getMfaEnabledEmail(name: string, organizationName: string): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const loginUrl = `${appUrl}/login`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">Two-Factor Authentication Enabled</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Enhanced security for your organization</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello ${name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">We're writing to inform you that <strong style="color: #1e293b;">Two-Factor Authentication (2FA/MFA)</strong> has been enabled for the organization <strong style="color: #2563eb;">${organizationName}</strong>.</p>
      
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
        <div style="display: flex; align-items: start; margin-bottom: 15px;">
          <div style="background: #2563eb; padding: 8px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">Action Required</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">You will need to set up 2FA on your next login to continue using the system. This is a mandatory security requirement.</p>
          </div>
        </div>
      </div>

      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">What This Means</h3>
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
          <li style="margin-bottom: 10px;">Enhanced security for your organization account</li>
          <li style="margin-bottom: 10px;">Protection against unauthorized access</li>
          <li style="margin-bottom: 10px;">You'll need to set up 2FA on your next login</li>
          <li>Use an authenticator app (like Google Authenticator) to generate codes</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3);">Go to Login</a>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Need Help?</strong><br>
          If you have any questions about setting up 2FA, please contact your organization administrator.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, '2FA/MFA Enabled');
  }

  getDataTransferredEmail(
    recipientName: string,
    transferredFromName: string,
    transferredFromEmail: string,
  ): string {
    const content = `
      <h2>Data Ownership Transferred</h2>
      <p>Hi ${recipientName},</p>
      <p>You have been assigned data ownership from <strong>${transferredFromName}</strong> (${transferredFromEmail}).</p>
      <p>This transfer occurred as part of access revocation.</p>
      <p>You now have access to all data previously owned by this user.</p>
    `;

    return this.getBaseTemplate(content, 'Data Ownership Transferred');
  }

  getOrganizationCreatedEmail(
    organizationName: string,
    organizationEmail: string,
    ownerName: string,
    ownerEmail: string,
    organizationDetails: {
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postal_code?: string | null;
      website?: string | null;
      description?: string | null;
    },
    verificationUrl: string,
    packageInfo?: {
      name: string;
      description?: string | null;
      base_user_limit: number;
      base_role_limit: number;
      price?: number | null;
    },
  ): string {
    // Package info HTML
    const packageHtml = packageInfo ? `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: white;">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </div>
          <div>
            <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">Package: ${packageInfo.name}</h3>
            ${packageInfo.description ? `<p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${packageInfo.description}</p>` : ''}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">User Limit</div>
            <div style="font-size: 24px; font-weight: 700;">${packageInfo.base_user_limit}</div>
          </div>
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Role Limit</div>
            <div style="font-size: 24px; font-weight: 700;">${packageInfo.base_role_limit}</div>
          </div>
          ${packageInfo.price !== null && packageInfo.price !== undefined && typeof packageInfo.price === 'number' && packageInfo.price > 0 ? `
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Price</div>
            <div style="font-size: 24px; font-weight: 700;">$${Number(packageInfo.price).toFixed(2)}</div>
          </div>
          ` : `
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Price</div>
            <div style="font-size: 24px; font-weight: 700;">Free</div>
          </div>
          `}
        </div>
      </div>
    ` : '';

    const detailsHtml = `
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Organization Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; width: 40%;">Organization Name:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Organization Email:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationEmail}</td>
          </tr>
          ${organizationDetails.phone ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Phone:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationDetails.phone}</td>
          </tr>
          ` : ''}
          ${organizationDetails.website ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Website:</td>
            <td style="padding: 12px 0;"><a href="${organizationDetails.website}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${organizationDetails.website}</a></td>
          </tr>
          ` : ''}
          ${(organizationDetails.address || organizationDetails.city || organizationDetails.state || organizationDetails.country || organizationDetails.postal_code) ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; vertical-align: top;">Address:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">
              ${[
                organizationDetails.address,
                organizationDetails.city,
                organizationDetails.state,
                organizationDetails.postal_code,
                organizationDetails.country
              ].filter(Boolean).join(', ')}
            </td>
          </tr>
          ` : ''}
          ${organizationDetails.description ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; vertical-align: top;">Description:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationDetails.description}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b; box-shadow: 0 2px 4px rgba(245,158,11,0.1);">
        <div style="display: flex; align-items: center;">
          <div style="background: #f59e0b; padding: 8px; border-radius: 8px; margin-right: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <path d="M20 8v6M23 11h-6"></path>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 15px;"><strong>Created By:</strong> ${ownerName}</p>
            <p style="margin: 5px 0 0 0; color: #78350f; font-size: 13px;">${ownerEmail}</p>
          </div>
        </div>
      </div>
    `;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">Organization Created Successfully!</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Welcome to your new organization</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello,</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">We're excited to inform you that an organization named <strong style="color: #1e293b;">${organizationName}</strong> has been successfully created and registered with this email address (<strong style="color: #2563eb;">${organizationEmail}</strong>).</p>
      
      ${packageHtml}
      ${detailsHtml}
      
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
        <div style="display: flex; align-items: start; margin-bottom: 15px;">
          <div style="background: #2563eb; padding: 8px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">Action Required</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">To activate and use this organization account, you must verify the organization email address. Click the button below to complete verification.</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3); transition: all 0.3s ease;">Verify Organization Email</a>
      </div>
      
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
          <strong>Or copy and paste this URL into your browser:</strong><br>
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all; font-size: 12px;">${verificationUrl}</a>
        </p>
        <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
          ⏰ This verification link will expire in <strong>24 hours</strong>
        </p>
      </div>
      
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ef4444; box-shadow: 0 2px 4px rgba(239,68,68,0.1);">
        <div style="display: flex; align-items: start;">
          <div style="background: #ef4444; padding: 8px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 15px; margin-bottom: 5px;">⚠️ Important Notice</p>
            <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">Email verification is <strong>mandatory</strong>. You will not be able to use the organization account until the email address is verified.</p>
          </div>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Didn't create this organization?</strong><br>
          If you did not create this organization, please contact our support team immediately to report this issue.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Organization Created');
  }

  getPackagePurchaseEmail(
    name: string,
    organizationName: string,
    packageName: string,
    amount: number,
    currency: string,
    purchasedBy: string,
    isPurchaser: boolean,
  ): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const packagesUrl = `${appUrl}/packages`;

    const currencySymbol = currency === 'NPR' ? 'Rs.' : '$';
    const formattedAmount = `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">Package Upgraded Successfully!</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Your organization has been upgraded</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello ${name},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">
        ${isPurchaser 
          ? `Great news! You have successfully upgraded <strong style="color: #1e293b;">${organizationName}</strong> to the <strong style="color: #2563eb;">${packageName}</strong> package.`
          : `Your organization <strong style="color: #1e293b;">${organizationName}</strong> has been upgraded to the <strong style="color: #2563eb;">${packageName}</strong> package by <strong>${purchasedBy}</strong>.`
        }
      </p>
      
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Purchase Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Package:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${packageName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Amount:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${organizationName}</td>
          </tr>
          ${!isPurchaser ? `
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Purchased By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${purchasedBy}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
        <div style="display: flex; align-items: start; margin-bottom: 15px;">
          <div style="background: #2563eb; padding: 8px; border-radius: 8px; margin-right: 12px; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4M12 8h.01"></path>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">What's Next?</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">Your organization now has access to all features included in the ${packageName} package. You can view your package details and manage your subscription from the packages page.</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${packagesUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3);">View Package Details</a>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your package upgrade, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Package Upgraded');
  }
}

