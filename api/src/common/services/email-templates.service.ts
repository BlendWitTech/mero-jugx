import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplatesService {
  constructor(private configService: ConfigService) { }

  getBaseTemplate(content: string, title?: string): string {
    const appName = this.configService.get<string>('APP_NAME', 'Mero Jugx');
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="x-apple-disable-message-reformatting">
          <title>${title || appName}</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            /* Reset styles */
            body, table, td, p, a, li, blockquote {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              outline: none;
              text-decoration: none;
            }
            
            /* Base styles */
            body {
              margin: 0;
              padding: 0;
              width: 100% !important;
              height: 100% !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f4f4f4;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Container */
            .email-wrapper {
              width: 100%;
              background-color: #f4f4f4;
              padding: 0;
              margin: 0;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            
            /* Content wrapper */
            .content-wrapper {
              padding: 20px;
            }
            
            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .content-wrapper {
                padding: 15px !important;
              }
              .header h1 {
                font-size: 22px !important;
              }
              .button {
                width: 100% !important;
                padding: 14px 20px !important;
                font-size: 16px !important;
              }
              table {
                width: 100% !important;
              }
              td {
                display: block !important;
                width: 100% !important;
                padding: 10px 0 !important;
                text-align: left !important;
              }
              .mobile-hide {
                display: none !important;
              }
            }
            
            /* Tablet responsive */
            @media only screen and (min-width: 601px) and (max-width: 1024px) {
              .email-container {
                max-width: 90% !important;
              }
              .content-wrapper {
                padding: 25px !important;
              }
            }
            
            /* Desktop styles */
            @media only screen and (min-width: 1025px) {
              .email-container {
                max-width: 600px;
              }
              .content-wrapper {
                padding: 30px;
              }
            }
            
            /* Header */
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
              font-weight: 700;
            }
            
            /* Content */
            .content {
              margin: 20px 0;
            }
            
            /* Buttons */
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(37,99,235,0.3);
            }
            .button:hover {
              background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
              box-shadow: 0 6px 8px rgba(37,99,235,0.4);
            }
            
            /* Links */
            .link {
              color: #2563eb;
              word-break: break-all;
              text-decoration: none;
            }
            .link:hover {
              text-decoration: underline;
            }
            
            /* Footer */
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
            }
            
            /* Spacer */
            .spacer {
              height: 20px;
              line-height: 20px;
              font-size: 1px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600">
                    <tr>
                      <td class="content-wrapper">
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
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;
  }

  getVerificationEmail(name: string, token: string, origin?: string): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(37,99,235,0.3);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            <path d="M9 11a3 3 0 0 0 6 0M9 11a3 3 0 0 1 6 0"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">Verify Your Email Address</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Welcome to ${this.configService.get<string>('APP_NAME', 'Mero Jugx')}!</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Thank you for joining us! To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
      
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
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">Why Verify?</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">Email verification helps us ensure the security of your account and allows you to receive important notifications.</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.3); transition: all 0.3s ease;">Verify Email Address</a>
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
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 15px; margin-bottom: 5px;">Didn't create an account?</p>
            <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">If you didn't create an account with us, please ignore this email. No action is required.</p>
          </div>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Need Help?</strong><br>
          If you're having trouble verifying your email, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Verify Your Email');
  }

  getPasswordResetEmail(name: string, token: string, origin?: string): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
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
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
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
      
      ${isNewUser
        ? `
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
      `
        : ''
      }
      
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

  getMfaEnabledEmail(name: string, organizationName: string, origin?: string): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
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
    origin?: string,
  ): string {
    // Package info HTML - simplified for better email client compatibility
    const packageHtml = packageInfo
      ? `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 20px;">
          <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px; margin-bottom: 15px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          </div>
          <h3 style="margin: 0 0 5px 0; color: white; font-size: 20px; font-weight: 700;">Package: ${packageInfo.name}</h3>
          ${packageInfo.description ? `<p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">${packageInfo.description}</p>` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center; width: 33.33%;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">User Limit</div>
              <div style="font-size: 24px; font-weight: 700;">${packageInfo.base_user_limit}</div>
            </td>
            <td style="width: 10px;"></td>
            <td style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center; width: 33.33%;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Role Limit</div>
              <div style="font-size: 24px; font-weight: 700;">${packageInfo.base_role_limit}</div>
            </td>
            <td style="width: 10px;"></td>
            <td style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; text-align: center; width: 33.33%;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Price</div>
              <div style="font-size: 24px; font-weight: 700;">${packageInfo.price !== null && packageInfo.price !== undefined && typeof packageInfo.price === 'number' && packageInfo.price > 0 ? `$${Number(packageInfo.price).toFixed(2)}` : 'Free'}</div>
            </td>
          </tr>
        </table>
      </div>
    `
      : '';

    // Build address string
    const addressParts = [
      organizationDetails.address,
      organizationDetails.city,
      organizationDetails.state,
      organizationDetails.postal_code,
      organizationDetails.country,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

    const detailsHtml = `
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 style="margin: 10px 0 0 0; color: #1e293b; font-size: 22px; font-weight: 700;">Organization Details</h3>
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
          ${organizationDetails.phone
        ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Phone:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationDetails.phone}</td>
          </tr>
          `
        : ''
      }
          ${organizationDetails.website
        ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Website:</td>
            <td style="padding: 12px 0;"><a href="${organizationDetails.website}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${organizationDetails.website}</a></td>
          </tr>
          `
        : ''
      }
          ${fullAddress
        ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; vertical-align: top;">Address:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${fullAddress}</td>
          </tr>
          `
        : ''
      }
          ${organizationDetails.description
        ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; vertical-align: top;">Description:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationDetails.description}</td>
          </tr>
          `
        : ''
      }
        </table>
      </div>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b; box-shadow: 0 2px 4px rgba(245,158,11,0.1);">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: middle; width: 50px;">
            <div style="background: #f59e0b; padding: 8px; border-radius: 8px; display: inline-block;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <path d="M20 8v6M23 11h-6"></path>
              </svg>
            </div>
          </div>
          <div style="display: table-cell; vertical-align: middle; padding-left: 12px;">
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
          ${!isPurchaser
        ? `
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Purchased By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${purchasedBy}</td>
          </tr>
          `
        : ''
      }
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

  getPackageExpiringEmail(
    userName: string,
    organizationName: string,
    packageName: string,
    daysRemaining: number,
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const packagesUrl = `${appUrl}/packages`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #f59e0b;">
          <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
          <h1 style="margin: 0; color: #92400e; font-size: 24px; font-weight: 700;">Package Expiring Soon</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello <strong style="color: #1e293b;">${userName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.7;">
          This is a reminder that your organization <strong style="color: #1e293b;">${organizationName}</strong>'s 
          <strong style="color: #2563eb;">${packageName}</strong> package will expire in 
          <strong style="color: #dc2626; font-size: 18px;">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.
        </p>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 16px; margin-bottom: 10px;">⚠️ Action Required</p>
          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
            To continue enjoying all the features of your current package, please renew your subscription before it expires. 
            Once expired, your organization will automatically revert to the Freemium package.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${packagesUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245,158,11,0.3);">Renew Package Now</a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Need Help?</strong><br>
          If you have any questions about your package or need assistance with renewal, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Package Expiring Soon');
  }

  getPackageExpiredEmail(
    userName: string,
    organizationName: string,
    expiredPackageName: string,
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const packagesUrl = `${appUrl}/packages`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #ef4444;">
          <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
          <h1 style="margin: 0; color: #991b1b; font-size: 24px; font-weight: 700;">Package Expired</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello <strong style="color: #1e293b;">${userName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.7;">
          Your organization <strong style="color: #1e293b;">${organizationName}</strong>'s 
          <strong style="color: #2563eb;">${expiredPackageName}</strong> package has expired.
        </p>

        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px; margin-bottom: 10px;">📦 Automatic Downgrade</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
            Your organization has been automatically reverted to the <strong>Freemium</strong> package. 
            Some features and limits may have been reduced. To restore full access, please upgrade to a paid package.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${packagesUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239,68,68,0.3);">Upgrade Package</a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your package or need assistance, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Package Expired');
  }

  getFeaturePurchaseEmail(
    name: string,
    organizationName: string,
    featureName: string,
    featureType: string,
    featureValue: number | null,
    amount: number,
    currency: string,
    purchasedBy: string,
    isPurchaser: boolean,
  ): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const packagesUrl = `${appUrl}/packages`;

    const currencySymbol = currency === 'NPR' ? 'Rs.' : '$';
    const formattedAmount = `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const featureDisplay =
      featureType === 'user_upgrade'
        ? `+${featureValue === null ? 'Unlimited' : featureValue} Users`
        : `+${featureValue === null ? 'Unlimited' : featureValue} Roles`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(139,92,246,0.3);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">Feature Purchased Successfully!</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Your organization has been upgraded</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">
        ${isPurchaser
        ? `Great news! You have successfully purchased the <strong style="color: #1e293b;">${featureName}</strong> feature for <strong style="color: #2563eb;">${organizationName}</strong>.`
        : `Your organization <strong style="color: #1e293b;">${organizationName}</strong> has purchased the <strong style="color: #2563eb;">${featureName}</strong> feature by <strong>${purchasedBy}</strong>.`
      }
      </p>
      
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 style="margin: 10px 0 0 0; color: #1e293b; font-size: 22px; font-weight: 700;">Purchase Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Feature:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${featureName} (${featureDisplay})</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Amount:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${organizationName}</td>
          </tr>
          ${!isPurchaser
        ? `
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Purchased By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${purchasedBy}</td>
          </tr>
          `
        : ''
      }
        </table>
      </div>

      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: top; width: 50px;">
            <div style="background: #2563eb; padding: 8px; border-radius: 8px; display: inline-block;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
            </div>
          </div>
          <div style="display: table-cell; vertical-align: top; padding-left: 12px;">
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">What's Next?</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">Your organization now has access to the ${featureName} feature. This feature is now active and available for use.</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${packagesUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139,92,246,0.3);">View Package Details</a>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your feature purchase, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'Feature Purchased');
  }

  getOrganizationInvitationNotificationEmail(
    inviterName: string,
    invitedEmail: string,
    organizationName: string,
    organizationEmail: string,
    invitationId: string,
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const invitationsUrl = `${appUrl}/invitations`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <path d="M20 8v6M23 11h-6"></path>
          </svg>
        </div>
        <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">New Invitation Created</h2>
        <p style="color: #64748b; font-size: 16px; margin: 0;">Someone has been invited to join your organization</p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello,</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.7;">
        <strong style="color: #1e293b;">${inviterName}</strong> has invited <strong style="color: #2563eb;">${invitedEmail}</strong> to join your organization <strong style="color: #1e293b;">${organizationName}</strong>.
      </p>
      
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 12px; border-radius: 10px; margin-bottom: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <path d="M20 8v6M23 11h-6"></path>
            </svg>
          </div>
          <h3 style="margin: 10px 0 0 0; color: #1e293b; font-size: 22px; font-weight: 700;">Invitation Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; width: 40%;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Invited Email:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${invitedEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Invited By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${inviterName}</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2563eb;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; vertical-align: top; width: 50px;">
            <div style="background: #2563eb; padding: 8px; border-radius: 8px; display: inline-block;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
              </svg>
            </div>
          </div>
          <div style="display: table-cell; vertical-align: top; padding-left: 12px;">
            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 8px;">What's Next?</p>
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">You can view and manage all invitations, including this one, from your organization dashboard. Track invitation status, resend invitations, or cancel them as needed.</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${invitationsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">View Invitations</a>
      </div>
      
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
          <strong>Or copy and paste this URL into your browser:</strong><br>
          <a href="${invitationsUrl}" style="color: #3b82f6; word-break: break-all; font-size: 12px;">${invitationsUrl}</a>
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Need Help?</strong><br>
          If you have any questions about this invitation or need assistance managing your organization, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'New Invitation Created');
  }

  getAppSubscriptionExpiringEmail(
    userName: string,
    organizationName: string,
    appName: string,
    daysRemaining: number,
    origin?: string,
  ): string {
    const appUrl = origin || process.env.FRONTEND_URL || 'http://localhost:3001';
    const appsUrl = `${appUrl}/apps`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #f59e0b;">
          <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
          <h1 style="margin: 0; color: #92400e; font-size: 24px; font-weight: 700;">Subscription Expiring Soon</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello <strong style="color: #1e293b;">${userName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.7;">
          Your organization <strong style="color: #1e293b;">${organizationName}</strong>'s 
          <strong style="color: #2563eb;">${appName}</strong> subscription expires in 
          <strong style="color: #f59e0b;">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.
        </p>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 16px; margin-bottom: 10px;">📱 Action Required</p>
          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
            To continue using <strong>${appName}</strong>, please renew your subscription before it expires. 
            After expiration, you will lose access to this app's features.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${appsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245,158,11,0.3);">Renew Subscription</a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your subscription or need assistance, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'App Subscription Expiring Soon');
  }

  getAppSubscriptionExpiredEmail(
    userName: string,
    organizationName: string,
    appName: string,
    origin?: string,
  ): string {
    const appUrl = origin || process.env.FRONTEND_URL || 'http://localhost:3001';
    const appsUrl = `${appUrl}/apps`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #ef4444;">
          <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
          <h1 style="margin: 0; color: #991b1b; font-size: 24px; font-weight: 700;">Subscription Expired</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello <strong style="color: #1e293b;">${userName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.7;">
          Your organization <strong style="color: #1e293b;">${organizationName}</strong>'s 
          <strong style="color: #2563eb;">${appName}</strong> subscription has expired.
        </p>

        <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px; margin-bottom: 10px;">📱 Access Suspended</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
            Your access to <strong>${appName}</strong> has been suspended. 
            To restore access, please renew your subscription.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${appsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239,68,68,0.3);">Renew Subscription</a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your subscription or need assistance, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'App Subscription Expired');
  }

  getAppSubscriptionRenewalDueEmail(
    userName: string,
    organizationName: string,
    appName: string,
    amount: number,
    origin?: string,
  ): string {
    const appUrl = origin || process.env.FRONTEND_URL || 'http://localhost:3001';
    const appsUrl = `${appUrl}/apps`;

    const formattedAmount = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #3b82f6;">
          <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
          <h1 style="margin: 0; color: #1e40af; font-size: 24px; font-weight: 700;">Renewal Due</h1>
        </div>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
        <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
          Hello <strong style="color: #1e293b;">${userName}</strong>,
        </p>
        
        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.7;">
          Your organization <strong style="color: #1e293b;">${organizationName}</strong>'s 
          <strong style="color: #2563eb;">${appName}</strong> subscription is due for renewal.
        </p>

        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; margin-bottom: 10px;">💰 Payment Required</p>
          <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
            Amount due: <strong style="font-size: 18px;">${formattedAmount}</strong><br>
            Please complete payment to continue using <strong>${appName}</strong>.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${appsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59,130,246,0.3);">Complete Payment</a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
          <strong>Questions?</strong><br>
          If you have any questions about your subscription or need assistance, please contact our support team.
        </p>
      </div>
    `;

    return this.getBaseTemplate(content, 'App Subscription Renewal Due');
  }

  getAppAccessGrantedEmail(
    name: string,
    organizationName: string,
    appName: string,
    grantedByName: string,
    isOwner: boolean = false,
    isActionPerformer: boolean = false,
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const appsUrl = `${appUrl}/apps`;

    let content: string;

    if (isActionPerformer) {
      // Email to the person who granted access
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Granted</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">You granted access successfully</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          You have successfully granted access to <strong style="color: #2563eb;">${appName}</strong> 
          for a user in <strong style="color: #1e293b;">${organizationName}</strong>.
        </p>
      `;
    } else if (isOwner) {
      // Email to organization owner
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Granted</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">Access granted in your organization</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          <strong style="color: #2563eb;">${grantedByName}</strong> has granted access to 
          <strong style="color: #1e293b;">${appName}</strong> for a user in your organization 
          <strong style="color: #2563eb;">${organizationName}</strong>.
        </p>
      `;
    } else {
      // Email to the user who received access
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Granted</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">You now have access to ${appName}</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          <strong style="color: #2563eb;">${grantedByName}</strong> has granted you access to 
          <strong style="color: #1e293b;">${appName}</strong> in <strong style="color: #2563eb;">${organizationName}</strong>.
        </p>
      `;
    }

    const commonContent = `
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Access Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; width: 40%;">App:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${appName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationName}</td>
          </tr>
          ${!isActionPerformer ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Granted By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${grantedByName}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${appsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16,185,129,0.3);">View Apps</a>
      </div>
    `;

    return this.getBaseTemplate(content + commonContent, 'App Access Granted');
  }

  getAppAccessRevokedEmail(
    name: string,
    organizationName: string,
    appName: string,
    revokedByName: string,
    isOwner: boolean = false,
    isActionPerformer: boolean = false,
    origin?: string,
  ): string {
    const appUrl = origin || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const appsUrl = `${appUrl}/apps`;

    let content: string;

    if (isActionPerformer) {
      // Email to the person who revoked access
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Revoked</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">You revoked access successfully</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          You have successfully revoked access to <strong style="color: #2563eb;">${appName}</strong> 
          for a user in <strong style="color: #1e293b;">${organizationName}</strong>.
        </p>
      `;
    } else if (isOwner) {
      // Email to organization owner
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Revoked</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">Access revoked in your organization</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          <strong style="color: #2563eb;">${revokedByName}</strong> has revoked access to 
          <strong style="color: #1e293b;">${appName}</strong> for a user in your organization 
          <strong style="color: #2563eb;">${organizationName}</strong>.
        </p>
      `;
    } else {
      // Email to the user who lost access
      content = `
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="color: white;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 10px 0;">App Access Revoked</h2>
          <p style="color: #64748b; font-size: 16px; margin: 0;">Your access to ${appName} has been revoked</p>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.7;">
          <strong style="color: #2563eb;">${revokedByName}</strong> has revoked your access to 
          <strong style="color: #1e293b;">${appName}</strong> in <strong style="color: #2563eb;">${organizationName}</strong>.
        </p>
      `;
    }

    const commonContent = `
      <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px; margin-bottom: 10px;">⚠️ Access Removed</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
          ${isActionPerformer
        ? 'The user will no longer be able to access this app.'
        : 'You will no longer be able to access this app. If you believe this is an error, please contact your organization administrator.'}
        </p>
      </div>
      
      <div style="background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 12px; border-radius: 10px; margin-right: 15px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1e293b; font-size: 22px; font-weight: 700;">Access Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569; width: 40%;">App:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${appName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Organization:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${organizationName}</td>
          </tr>
          ${!isActionPerformer ? `
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Revoked By:</td>
            <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${revokedByName}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${appsUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(239,68,68,0.3);">View Apps</a>
      </div>
    `;

    return this.getBaseTemplate(content + commonContent, 'App Access Revoked');
  }

  getMarketingEmail(name: string, content: string, organizationId: string): string {
    const appUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const unsubscribeUrl = `${appUrl}/org/${organizationId}/settings?tab=notifications`;

    const emailContent = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Special Update</h2>
        <p style="margin: 15px 0 0 0; color: #f0f0f0; font-size: 16px;">Exclusive content just for you!</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Hello <strong style="color: #1e293b;">${name}</strong>,</p>
        <div style="color: #475569; font-size: 16px; line-height: 1.7;">
          ${content}
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">Don't want to receive these emails?</p>
        <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline; font-size: 14px;">Unsubscribe from marketing emails</a>
      </div>
    `;

    return this.getBaseTemplate(emailContent, 'Marketing Update');
  }
}
