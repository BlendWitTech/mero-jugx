import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EsewaService } from './esewa.service';
import { StripeService } from './stripe.service';
import { Payment } from '../database/entities/payment.entity';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';
import { PackagesModule } from '../packages/packages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Organization, User]),
    forwardRef(() => PackagesModule),
    NotificationsModule,
    CommonModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, EsewaService, StripeService],
  exports: [PaymentsService, EsewaService, StripeService],
})
export class PaymentsModule {}

