import { IsInt, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferTicketToBoardDto {
  @ApiProperty({ description: 'App ID' })
  @IsInt()
  app_id: number;

  @ApiPropertyOptional({ description: 'User ID to assign the ticket to in the board' })
  @IsUUID()
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ description: 'Board ID (if app supports multiple boards)' })
  @IsOptional()
  board_id?: string;
}

