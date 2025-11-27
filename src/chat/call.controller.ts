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
import { CallService } from './call.service';
import { CreateCallDto } from './dto/create-call.dto';
import { WebRTCSignalDto } from './dto/webrtc-signal.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('chats/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: 201, description: 'Call initiated successfully' })
  async initiateCall(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('chatId') chatId: string,
    @Body() dto: CreateCallDto,
  ) {
    return this.callService.initiateCall(userId, organizationId, chatId, dto);
  }

  @Get('chats/:chatId/active')
  @ApiOperation({ summary: 'Get active call for a chat' })
  @ApiResponse({ status: 200, description: 'Active call details' })
  async getActiveCall(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.callService.getActiveCall(userId, organizationId, chatId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a call' })
  @ApiResponse({ status: 200, description: 'Joined call successfully' })
  async joinCall(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') callId: string,
  ) {
    return this.callService.joinCall(userId, organizationId, callId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a call' })
  @ApiResponse({ status: 204, description: 'Left call successfully' })
  async leaveCall(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') callId: string,
  ) {
    return this.callService.leaveCall(userId, organizationId, callId);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End a call (initiator only)' })
  @ApiResponse({ status: 204, description: 'Call ended successfully' })
  async endCall(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') callId: string,
  ) {
    return this.callService.endCall(userId, organizationId, callId);
  }

  @Put(':id/media')
  @ApiOperation({ summary: 'Update participant media settings (audio/video)' })
  @ApiResponse({ status: 200, description: 'Media settings updated' })
  async updateParticipantMedia(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') callId: string,
    @Body() body: { audio_enabled?: boolean; video_enabled?: boolean },
  ) {
    return this.callService.updateParticipantMedia(
      userId,
      organizationId,
      callId,
      body.audio_enabled,
      body.video_enabled,
    );
  }

  @Post(':id/signal')
  @ApiOperation({ summary: 'Send WebRTC signaling data' })
  @ApiResponse({ status: 200, description: 'Signal processed' })
  async handleWebRTCSignal(
    @CurrentUser('id') userId: string,
    @CurrentOrganization('id') organizationId: string,
    @Param('id') callId: string,
    @Body() dto: WebRTCSignalDto,
  ) {
    return this.callService.handleWebRTCSignal(userId, organizationId, callId, dto);
  }
}

