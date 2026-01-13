import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';
import { AdminChat } from '../database/entities/admin_chats.entity';
import { AdminChatMessage } from '../database/entities/admin_chat_messages.entity';
import { AdminChatMessageAttachment } from '../database/entities/admin_chat_message_attachments.entity';
import { OrganizationMember } from '../database/entities/organization_members.entity';
import { User } from '../database/entities/users.entity';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminChat, AdminChatMessage, AdminChatMessageAttachment, OrganizationMember, User]),
    TicketsModule,
  ],
  controllers: [AdminChatController],
  providers: [AdminChatService],
  exports: [AdminChatService],
})
export class AdminChatModule {}

