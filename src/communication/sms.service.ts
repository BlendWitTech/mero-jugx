import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioAccountSid: string | null;
  private readonly twilioAuthToken: string | null;
  private readonly twilioFromNumber: string | null;
  private readonly enabled: boolean;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || null;
    this.twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || null;
    this.twilioFromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER') || null;
    this.enabled = !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioFromNumber);

    if (!this.enabled) {
      this.logger.warn('SMS service is disabled. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER must be configured.');
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      this.logger.warn(`SMS sending disabled. Would send to ${to}: ${message}`);
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', this.twilioFromNumber!);
      formData.append('Body', message);

      const response = await firstValueFrom(
        this.httpService.post(url, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64')}`,
          },
        }),
      );

      this.logger.log(`SMS sent successfully to ${to}. SID: ${response.data.sid}`);
      return { success: true, messageId: response.data.sid };
    } catch (error: any) {
      this.logger.error(`Failed to send SMS to ${to}:`, error.message);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Send verification code via SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your verification code is: ${code}. This code will expire in 10 minutes.`;
    const result = await this.sendSms(phoneNumber, message);
    return result.success;
  }

  /**
   * Send notification SMS
   */
  async sendNotification(phoneNumber: string, title: string, body: string): Promise<boolean> {
    const message = `${title}\n\n${body}`;
    const result = await this.sendSms(phoneNumber, message);
    return result.success;
  }
}

