import { Injectable } from '@nestjs/common';
import { SmsService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class CommunicationService {
  constructor(
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}
}

