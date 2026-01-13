import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptAppInvitationDto {
  // No fields required - acceptance is just via token
}

