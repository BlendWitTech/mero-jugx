import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MfaSetupGuard } from '../auth/guards/mfa-setup.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetupMfaDto } from './dto/setup-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';

@ApiTags('mfa')
@Controller('mfa')
@ApiBearerAuth()
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('check')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Check if MFA is required and setup status' })
  @ApiResponse({ status: 200, description: 'MFA status retrieved successfully' })
  async checkMfaRequired(@CurrentUser() user: any) {
    return this.mfaService.checkMfaRequired(user.userId, user.organizationId);
  }

  @Post('setup/initialize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MfaSetupGuard)
  @ApiOperation({ summary: 'Initialize 2FA setup (get QR code)' })
  @ApiResponse({ status: 200, description: '2FA setup initialized successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or MFA not enabled for organization' })
  @ApiResponse({ status: 400, description: '2FA already set up' })
  async initializeSetup(@CurrentUser() user: any) {
    return this.mfaService.initializeSetup(user.userId, user.organizationId);
  }

  @Post('setup/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MfaSetupGuard)
  @ApiOperation({ summary: 'Verify and complete 2FA setup' })
  @ApiResponse({ status: 200, description: '2FA setup completed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifyAndCompleteSetup(
    @CurrentUser() user: any,
    @Body() dto: SetupMfaDto,
  ) {
    // Get temp_setup_token from request (set by guard) or from DTO
    const request = (user as any).__request || {};
    const tempSetupToken = request.tempSetupToken || dto.temp_setup_token;
    
    // Validate that we have a token
    if (!tempSetupToken) {
      throw new BadRequestException('MFA setup token is required. Please provide it via X-MFA-Setup-Token header or temp_setup_token in the request body.');
    }
    
    return this.mfaService.verifyAndCompleteSetup(
      user.userId,
      user.organizationId,
      dto,
      tempSetupToken,
    );
  }

  @Get('backup-codes')
  @Permissions('mfa.backup-codes')
  @ApiOperation({ summary: 'Get 2FA backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: '2FA not enabled' })
  async getBackupCodes(@CurrentUser() user: any) {
    return this.mfaService.getBackupCodes(user.userId, user.organizationId);
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @Permissions('mfa.backup-codes')
  @ApiOperation({ summary: 'Regenerate 2FA backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or 2FA not enabled' })
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body() dto: VerifyMfaDto,
  ) {
    return this.mfaService.regenerateBackupCodes(
      user.userId,
      user.organizationId,
      dto,
    );
  }

  @Delete('disable')
  @HttpCode(HttpStatus.OK)
  @Permissions('mfa.disable')
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or 2FA not enabled' })
  async disableMfa(
    @CurrentUser() user: any,
    @Body() dto: DisableMfaDto,
  ) {
    return this.mfaService.disableMfa(user.userId, user.organizationId, dto);
  }
}

