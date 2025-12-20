import { IsString, IsOptional, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEpicDto {
  @ApiPropertyOptional({ description: 'Epic name' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Epic description' })
  @IsString()
  @IsOptional()
  description?: string;

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

