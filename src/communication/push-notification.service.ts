import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'normal' | 'high';
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly firebaseServerKey: string | null;
  private readonly enabled: boolean;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.firebaseServerKey = this.configService.get<string>('FIREBASE_SERVER_KEY') || null;
    this.enabled = !!this.firebaseServerKey;

    if (!this.enabled) {
      this.logger.warn('Push notification service is disabled. FIREBASE_SERVER_KEY must be configured.');
    }
  }

  /**
   * Send push notification via FCM (Firebase Cloud Messaging)
   */
  async sendPushNotification(
    deviceToken: string,
    payload: PushNotificationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      this.logger.warn(`Push notification disabled. Would send to ${deviceToken}: ${payload.title}`);
      return { success: false, error: 'Push notification service not configured' };
    }

    try {
      const fcmUrl = 'https://fcm.googleapis.com/fcm/send';

      const notification = {
        to: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
          sound: payload.sound || 'default',
          badge: payload.badge,
          priority: payload.priority || 'high',
        },
        data: payload.data || {},
      };

      const response = await firstValueFrom(
        this.httpService.post(fcmUrl, notification, {
          headers: {
            'Authorization': `key=${this.firebaseServerKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Push notification sent successfully. Message ID: ${response.data.message_id}`);
      return { success: true, messageId: response.data.message_id };
    } catch (error: any) {
      this.logger.error(`Failed to send push notification:`, error.message);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    deviceTokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      deviceTokens.map(async (token) => {
        const result = await this.sendPushNotification(token, payload);
        if (result.success) {
          success++;
        } else {
          failed++;
        }
      }),
    );

    return { success, failed };
  }
}

