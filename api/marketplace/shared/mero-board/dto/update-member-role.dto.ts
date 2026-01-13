import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export class UpdateMemberRoleDto {
  @ApiProperty({ description: 'New role for the member', enum: WorkspaceRole })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

