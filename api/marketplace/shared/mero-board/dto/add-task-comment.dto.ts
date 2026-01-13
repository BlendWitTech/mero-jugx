import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTaskCommentDto {
  @ApiProperty({ description: 'Comment body' })
  @IsString()
  @MaxLength(5000)
  body: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for threaded comments' })
  @IsOptional()
  @IsUUID()
  parent_comment_id?: string;
}

