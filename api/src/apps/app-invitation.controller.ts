import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { AppInvitationService } from './app-invitation.service';
import { CreateAppInvitationDto } from './dto/create-app-invitation.dto';
import { AcceptAppInvitationDto } from './dto/accept-app-invitation.dto';

@ApiTags('app-invitations')
@Controller('apps/invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppInvitationController {
  constructor(private readonly appInvitationService: AppInvitationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an app invitation for an organization member' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'App or user not found' })
  @ApiResponse({ status: 409, description: 'User already has access or pending invitation' })
  async createInvitation(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Body() dto: CreateAppInvitationDto,
  ) {
    return this.appInvitationService.createInvitation(
      user.userId,
      organization.id,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get app invitations for the current user' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async getInvitations(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ) {
    return this.appInvitationService.getInvitations(
      user.userId,
      organization.id,
    );
  }

  @Post('accept/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an app invitation by token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending or expired' })
  @ApiResponse({ status: 403, description: 'Invitation is not for you' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  async acceptInvitationByToken(
    @CurrentUser() user: any,
    @Param('token') token: string,
    @Body() dto: AcceptAppInvitationDto,
  ) {
    return this.appInvitationService.acceptInvitation(
      user.userId,
      token,
      dto,
    );
  }

  @Post(':invitationId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an app invitation by ID' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending or expired' })
  @ApiResponse({ status: 403, description: 'Invitation is not for you' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  async acceptInvitationById(
    @CurrentUser() user: any,
    @Param('invitationId') invitationId: string,
    @Body() dto: AcceptAppInvitationDto,
  ) {
    // Get invitation to retrieve token
    const invitation = await this.appInvitationService.getInvitationById(
      user.userId,
      invitationId,
    );
    return this.appInvitationService.acceptInvitation(
      user.userId,
      invitation.token,
      dto,
    );
  }

  @Put(':invitationId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an app invitation' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 403, description: 'Invitation is not for you' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  async declineInvitation(
    @CurrentUser() user: any,
    @Param('invitationId') invitationId: string,
  ) {
    await this.appInvitationService.declineInvitation(
      user.userId,
      invitationId,
    );
    return { message: 'Invitation declined successfully' };
  }

  @Delete(':invitationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an app invitation (by inviter)' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 403, description: 'You did not create this invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  async cancelInvitation(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Param('invitationId') invitationId: string,
  ) {
    await this.appInvitationService.cancelInvitation(
      user.userId,
      organization.id,
      invitationId,
    );
    return { message: 'Invitation cancelled successfully' };
  }
}

