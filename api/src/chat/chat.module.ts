import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { Chat } from '../database/entities/chats.entity';
import { ChatMember } from '../database/entities/chat_members.entity';
import { Message } from '../database/entities/messages.entity';
import { MessageAttachment } from '../database/entities/message_attachments.entity';
import { MessageReaction } from '../database/entities/message_reactions.entity';
import { MessageReadStatus } from '../database/entities/message_read_status.entity';
import { CallSession } from '../database/entities/call_sessions.entity';
import { CallParticipant } from '../database/entities/call_participants.entity';
import { Organization } from '../database/entities/organizations.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { Package } from '../database/entities/packages.entity';
import { OrganizationPackageFeature } from '../database/entities/organization_package_features.entity';
import { PackageFeature } from '../database/entities/package_features.entity';
import { Role } from '../database/entities/roles.entity';
import { Ticket } from '../database/entities/tickets.entity';
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
      MessageReadStatus,
      CallSession,
      CallParticipant,
      Organization,
      OrganizationMember,
      User,
      Package,
      OrganizationPackageFeature,
      PackageFeature,
      Role,
      Ticket,
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
export class ChatModule implements OnModuleInit {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  onModuleInit() {
    // Set gateway reference in service to avoid circular dependency
    this.chatService.setGateway(this.chatGateway);
  }
}

