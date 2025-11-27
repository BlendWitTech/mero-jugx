import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CallSession, CallType, CallStatus } from '../database/entities/call-session.entity';
import { CallParticipant, CallParticipantStatus } from '../database/entities/call-participant.entity';
import { Chat } from '../database/entities/chat.entity';
import { ChatMember, ChatMemberStatus } from '../database/entities/chat-member.entity';
import { OrganizationMember, OrganizationMemberStatus } from '../database/entities/organization-member.entity';
import { CreateCallDto } from './dto/create-call.dto';
import { WebRTCSignalDto } from './dto/webrtc-signal.dto';
import { ChatService } from './chat.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CallService {
  constructor(
    @InjectRepository(CallSession)
    private callSessionRepository: Repository<CallSession>,
    @InjectRepository(CallParticipant)
    private callParticipantRepository: Repository<CallParticipant>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMember)
    private chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    private chatService: ChatService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Initiate a call (audio or video)
   */
  async initiateCall(
    userId: string,
    organizationId: string,
    chatId: string,
    dto: CreateCallDto,
  ): Promise<CallSession> {
    // Check chat access
    const hasAccess = await this.chatService.hasChatAccess(organizationId);
    if (!hasAccess) {
      throw new ForbiddenException('Chat feature is not available');
    }

    // Verify chat exists and user is a member
    const chat = await this.chatService.findOne(userId, organizationId, chatId);

    // Check if there's already an active call
    const activeCall = await this.callSessionRepository.findOne({
      where: {
        chat_id: chatId,
        status: In([CallStatus.INITIATING, CallStatus.RINGING, CallStatus.ACTIVE]),
      },
    });

    if (activeCall) {
      throw new BadRequestException('There is already an active call in this chat');
    }

    // Create call session
    const callSession = this.callSessionRepository.create({
      chat_id: chatId,
      initiated_by: userId,
      type: dto.type,
      status: CallStatus.INITIATING,
    });

    const savedCall = await this.callSessionRepository.save(callSession);

    // Add all chat members as participants
    const activeMembers = chat.members.filter((m) => m.status === ChatMemberStatus.ACTIVE);
    const participants = activeMembers.map((member) =>
      this.callParticipantRepository.create({
        call_session_id: savedCall.id,
        user_id: member.user_id,
        status: member.user_id === userId ? CallParticipantStatus.JOINED : CallParticipantStatus.INVITED,
        joined_at: member.user_id === userId ? new Date() : null,
        audio_enabled: dto.type === CallType.AUDIO || dto.type === CallType.VIDEO,
        video_enabled: dto.type === CallType.VIDEO,
      }),
    );

    await this.callParticipantRepository.save(participants);

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'call.initiated',
      'call',
      savedCall.id,
      null,
      { type: dto.type, chat_id: chatId },
    );

    return this.callSessionRepository.findOne({
      where: { id: savedCall.id },
      relations: ['chat', 'initiator', 'participants', 'participants.user'],
    });
  }

  /**
   * Get active call for a chat
   */
  async getActiveCall(userId: string, organizationId: string, chatId: string): Promise<CallSession | null> {
    await this.chatService.verifyMembership(userId, organizationId);

    const call = await this.callSessionRepository.findOne({
      where: {
        chat_id: chatId,
        status: In([CallStatus.INITIATING, CallStatus.RINGING, CallStatus.ACTIVE]),
      },
      relations: ['chat', 'initiator', 'participants', 'participants.user'],
    });

    if (!call) {
      return null;
    }

    // Verify user is a participant
    const isParticipant = call.participants.some((p) => p.user_id === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this call');
    }

    return call;
  }

  /**
   * Join a call
   */
  async joinCall(userId: string, organizationId: string, callId: string): Promise<CallSession> {
    const call = await this.callSessionRepository.findOne({
      where: { id: callId },
      relations: ['chat', 'participants'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.chat.organization_id !== organizationId) {
      throw new ForbiddenException('Call does not belong to this organization');
    }

    // Verify user is a member of the chat
    await this.chatService.verifyMembership(userId, organizationId);

    let participant = call.participants.find((p) => p.user_id === userId);

    if (!participant) {
      // Add as new participant
      participant = this.callParticipantRepository.create({
        call_session_id: callId,
        user_id: userId,
        status: CallParticipantStatus.JOINED,
        joined_at: new Date(),
        audio_enabled: true,
        video_enabled: call.type === CallType.VIDEO,
      });
      await this.callParticipantRepository.save(participant);
    } else {
      // Update existing participant
      participant.status = CallParticipantStatus.JOINED;
      participant.joined_at = new Date();
      await this.callParticipantRepository.save(participant);
    }

    // Update call status if needed
    if (call.status === CallStatus.INITIATING || call.status === CallStatus.RINGING) {
      call.status = CallStatus.ACTIVE;
      call.started_at = new Date();
      await this.callSessionRepository.save(call);
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'call.joined',
      'call',
      callId,
      null,
      null,
    );

    return this.callSessionRepository.findOne({
      where: { id: callId },
      relations: ['chat', 'initiator', 'participants', 'participants.user'],
    });
  }

  /**
   * Leave a call
   */
  async leaveCall(userId: string, organizationId: string, callId: string): Promise<void> {
    const call = await this.callSessionRepository.findOne({
      where: { id: callId },
      relations: ['participants'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const participant = call.participants.find((p) => p.user_id === userId);
    if (participant) {
      participant.status = CallParticipantStatus.LEFT;
      participant.left_at = new Date();
      await this.callParticipantRepository.save(participant);
    }

    // Check if all participants have left
    const activeParticipants = call.participants.filter(
      (p) => p.status === CallParticipantStatus.JOINED,
    );

    if (activeParticipants.length === 0 && call.status === CallStatus.ACTIVE) {
      // End the call
      call.status = CallStatus.ENDED;
      call.ended_at = new Date();
      if (call.started_at) {
        call.duration_seconds = Math.floor(
          (call.ended_at.getTime() - call.started_at.getTime()) / 1000,
        );
      }
      await this.callSessionRepository.save(call);
    }

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'call.left',
      'call',
      callId,
      null,
      null,
    );
  }

  /**
   * End a call (only initiator or admin can end)
   */
  async endCall(userId: string, organizationId: string, callId: string): Promise<void> {
    const call = await this.callSessionRepository.findOne({
      where: { id: callId },
      relations: ['chat', 'participants'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.chat.organization_id !== organizationId) {
      throw new ForbiddenException('Call does not belong to this organization');
    }

    // Only initiator can end the call
    if (call.initiated_by !== userId) {
      throw new ForbiddenException('Only the call initiator can end the call');
    }

    call.status = CallStatus.ENDED;
    call.ended_at = new Date();
    if (call.started_at) {
      call.duration_seconds = Math.floor((call.ended_at.getTime() - call.started_at.getTime()) / 1000);
    }

    await this.callSessionRepository.save(call);

    // Update all participants
    await this.callParticipantRepository.update(
      { call_session_id: callId, status: CallParticipantStatus.JOINED },
      { status: CallParticipantStatus.LEFT, left_at: new Date() },
    );

    await this.auditLogsService.createAuditLog(
      organizationId,
      userId,
      'call.ended',
      'call',
      callId,
      null,
      null,
    );
  }

  /**
   * Update participant media settings (audio/video)
   */
  async updateParticipantMedia(
    userId: string,
    organizationId: string,
    callId: string,
    audioEnabled?: boolean,
    videoEnabled?: boolean,
  ): Promise<CallParticipant> {
    const call = await this.callSessionRepository.findOne({
      where: { id: callId },
    });

    if (!call || call.chat.organization_id !== organizationId) {
      throw new NotFoundException('Call not found');
    }

    const participant = await this.callParticipantRepository.findOne({
      where: { call_session_id: callId, user_id: userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (audioEnabled !== undefined) {
      participant.audio_enabled = audioEnabled;
    }
    if (videoEnabled !== undefined) {
      participant.video_enabled = videoEnabled;
    }

    await this.callParticipantRepository.save(participant);

    return participant;
  }

  /**
   * Handle WebRTC signaling
   */
  async handleWebRTCSignal(
    userId: string,
    organizationId: string,
    callId: string,
    dto: WebRTCSignalDto,
  ): Promise<void> {
    const call = await this.callSessionRepository.findOne({
      where: { id: callId },
    });

    if (!call || call.chat.organization_id !== organizationId) {
      throw new NotFoundException('Call not found');
    }

    // Verify user is a participant
    const participant = await this.callParticipantRepository.findOne({
      where: { call_session_id: callId, user_id: userId },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this call');
    }

    // Store WebRTC signals (this will be handled by WebSocket gateway in real-time)
    if (dto.type === 'offer') {
      call.webrtc_offer = dto.sdp;
    } else if (dto.type === 'answer') {
      call.webrtc_answer = dto.sdp;
    } else if (dto.type === 'ice-candidate') {
      if (!call.ice_candidates) {
        call.ice_candidates = [];
      }
      call.ice_candidates.push(dto.candidate);
    }

    await this.callSessionRepository.save(call);
  }
}

