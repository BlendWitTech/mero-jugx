import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskCommentDto {
  @ApiPropertyOptional({ description: 'Updated comment body' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;
}

