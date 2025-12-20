import { IsString, IsOptional, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Board ID to associate with project' })
  @IsUUID()
  @IsOptional()
  board_id?: string;

  @ApiPropertyOptional({ description: 'Project owner user ID' })
  @IsUUID()
  @IsOptional()
  owner_id?: string;

  @ApiPropertyOptional({ description: 'Project start date' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Project end date' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}

