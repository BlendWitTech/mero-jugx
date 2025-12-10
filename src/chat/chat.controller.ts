import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatQueryDto } from './dto/chat-query.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat (direct or group)' })
  @ApiResponse({ status: 201, description: 'Chat created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No chat access or permission denied' })
  async createChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatService.createChat(userId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user' })
  @ApiResponse({ status: 200, description: 'List of chats' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Query() query: ChatQueryDto,
  ) {
    return this.chatService.findAll(userId, organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single chat by ID' })
  @ApiResponse({ status: 200, description: 'Chat details' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.findOne(userId, organizationId, chatId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update chat details (group chats only)' })
  @ApiResponse({ status: 200, description: 'Chat updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to update' })
  async updateChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: UpdateChatDto,
  ) {
    return this.chatService.updateChat(userId, organizationId, chatId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete/Archive a chat' })
  @ApiResponse({ status: 204, description: 'Chat deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only owner can delete group chats' })
  async deleteChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.deleteChat(userId, organizationId, chatId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to a group chat' })
  @ApiResponse({ status: 200, description: 'Members added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to add members' })
  @Permissions('chat.manage_group')
  @UseGuards(PermissionsGuard)
  async addMembers(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.chatService.addMembers(userId, organizationId, chatId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a group chat' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to remove members' })
  @Permissions('chat.manage_group')
  @UseGuards(PermissionsGuard)
  async removeMember(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.chatService.removeMember(userId, organizationId, chatId, memberId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a chat' })
  @ApiResponse({ status: 204, description: 'Left chat successfully' })
  async leaveChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.leaveChat(userId, organizationId, chatId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, organizationId, chatId, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(userId, organizationId, chatId, query);
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to delete message' })
  async deleteMessage(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(userId, organizationId, messageId);
  }

  @Put(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive or unarchive a chat' })
  @ApiResponse({ status: 200, description: 'Chat archived/unarchived successfully' })
  async archiveChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: { archive: boolean },
  ) {
    return this.chatService.archiveChat(userId, organizationId, chatId, dto.archive);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export chat history' })
  @ApiResponse({ status: 200, description: 'Chat exported successfully' })
  async exportChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
  ) {
    return this.chatService.exportChat(userId, organizationId, chatId);
  }
}

