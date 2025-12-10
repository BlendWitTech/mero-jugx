import { IsArray, IsString, IsInt, IsOptional, IsDateString, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkAssignRoleDto {
  @ApiProperty({
    description: 'Array of user IDs',
    type: [String],
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  user_ids: string[];

  @ApiProperty({
    description: 'Role ID to assign',
    example: 1,
  })
  @IsInt()
  role_id: number;
}

export class BulkSendInvitationsDto {
  @ApiProperty({
    description: 'Array of email addresses',
    type: [String],
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  emails: string[];

  @ApiProperty({
    description: 'Role ID to assign to invited users',
    example: 1,
  })
  @IsInt()
  role_id: number;
}

export class ImportUsersDto {
  @ApiProperty({
    description: 'CSV data as string',
    example: 'Email,First Name,Last Name\nuser@example.com,John,Doe',
  })
  @IsString()
  csv_data: string;

  @ApiProperty({
    description: 'Role ID to assign to imported users',
    example: 1,
  })
  @IsInt()
  role_id: number;
}

export class ExportAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Start date (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601 format)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

