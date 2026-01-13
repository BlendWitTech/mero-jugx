import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationQueryDto } from './dto/invitation-query.dto';

@ApiTags('invitations')
@Controller('invitations')
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'User already member or invitation exists' })
  async createInvitation(
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
    @Headers('origin') origin?: string,
  ) {
    return this.invitationsService.createInvitation(user.userId, user.organizationId, dto, origin);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.view')
  @ApiOperation({ summary: 'List invitations' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getInvitations(@CurrentUser() user: any, @Query() query: InvitationQueryDto) {
    return this.invitationsService.getInvitations(user.userId, user.organizationId, query);
  }

  @Get('token/:token')
  @Public()
  @ApiOperation({ summary: 'Get invitation by token (public)' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invitation expired or invalid' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post('accept/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation (public)' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid invitation or missing required fields' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'User already member' })
  async acceptInvitation(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(token, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('invitations.cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Only pending invitations can be cancelled' })
  async cancelInvitation(@CurrentUser() user: any, @Param('id') invitationId: string) {
    return this.invitationsService.cancelInvitation(user.userId, user.organizationId, invitationId);
  }
}
