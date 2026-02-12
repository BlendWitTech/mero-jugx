import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EpicStatus } from '../../../../src/database/entities/epics.entity';

export class UpdateEpicDto {
  @ApiPropertyOptional({ description: 'Epic name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Epic description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Epic status', enum: EpicStatus })
  @IsOptional()
  @IsEnum(EpicStatus)
  status?: EpicStatus;

  @ApiPropertyOptional({ description: 'Assignee ID' })
  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}


