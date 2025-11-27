import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { Chat } from '../database/entities/chat.entity';
import { ChatMember } from '../database/entities/chat-member.entity';
import { Message } from '../database/entities/message.entity';
import { MessageAttachment } from '../database/entities/message-attachment.entity';
import { MessageReaction } from '../database/entities/message-reaction.entity';
import { CallSession } from '../database/entities/call-session.entity';
import { CallParticipant } from '../database/entities/call-participant.entity';
import { Organization } from '../database/entities/organization.entity';
import { OrganizationMember } from '../database/entities/organization-member.entity';
import { User } from '../database/entities/user.entity';
import { Package } from '../database/entities/package.entity';
import { OrganizationPackageFeature } from '../database/entities/organization-package-feature.entity';
import { PackageFeature } from '../database/entities/package-feature.entity';
import { Role } from '../database/entities/role.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RolesModule } from '../roles/roles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chat,
      ChatMember,
      Message,
      MessageAttachment,
      MessageReaction,
      CallSession,
      CallParticipant,
      Organization,
      OrganizationMember,
      User,
      Package,
      OrganizationPackageFeature,
      PackageFeature,
      Role,
    ]),
    AuditLogsModule,
    forwardRef(() => RolesModule),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController, CallController],
  providers: [ChatService, CallService, ChatGateway],
  exports: [ChatService, CallService, ChatGateway],
})
export class ChatModule {}

