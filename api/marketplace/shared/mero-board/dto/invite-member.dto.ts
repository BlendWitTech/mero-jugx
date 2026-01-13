import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export class InviteMemberDto {
  @ApiProperty({ description: 'User email to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Role for the member', enum: WorkspaceRole })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

