import { IsEnum } from 'class-validator';
import { CallType } from '../../database/entities/call_sessions.entity';

export class CreateCallDto {
  @IsEnum(CallType)
  type: CallType;
}

