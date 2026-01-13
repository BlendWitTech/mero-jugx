import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { AdminChatService } from './admin-chat.service';
import { CreateAdminChatDto } from './dto/create-admin-chat.dto';
import { SendAdminChatMessageDto } from './dto/send-admin-chat-message.dto';
import { AdminChatQueryDto } from './dto/admin-chat-query.dto';
import { AdminChatStatus } from '../database/entities/admin_chats.entity';

@ApiTags('Admin Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin-chat')
export class AdminChatController {
  constructor(private readonly adminChatService: AdminChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new admin chat' })
  @ApiResponse({ status: 201, description: 'Admin chat created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to chat with admin' })
  async createChat(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Body() dto: CreateAdminChatDto,
  ) {
    return this.adminChatService.createChat(userId, organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admin chats' })
  @ApiResponse({ status: 200, description: 'List of admin chats' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Query() query: AdminChatQueryDto,
  ) {
    return this.adminChatService.findAll(userId, organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin chat details' })
  @ApiResponse({ status: 200, description: 'Admin chat details' })
  @ApiResponse({ status: 404, description: 'Admin chat not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
  ) {
    return this.adminChatService.findOne(userId, organizationId, chatId, true);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in admin chat' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: SendAdminChatMessageDto,
  ) {
    return this.adminChatService.sendMessage(userId, organizationId, chatId, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for an admin chat' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.adminChatService.getMessages(userId, organizationId, chatId, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update admin chat status (system admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body('status') status: AdminChatStatus,
  ) {
    return this.adminChatService.updateStatus(userId, organizationId, chatId, status);
  }

  @Post(':id/flag-message')
  @ApiOperation({ summary: 'Flag an admin chat message to create a ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created from admin chat message' })
  async flagMessage(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') chatId: string,
    @Body() dto: any, // CreateTicketFromChatDto
  ) {
    return this.adminChatService.flagMessage(userId, organizationId, chatId, dto);
  }
}

