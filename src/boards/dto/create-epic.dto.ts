import { IsString, IsOptional, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEpicDto {
  @ApiProperty({ description: 'Epic name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Epic description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsUUID()
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'Epic start date' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Epic end date' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

