import { IsEnum } from 'class-validator';
import { CallType } from '../../database/entities/call-session.entity';

export class CreateCallDto {
  @IsEnum(CallType)
  type: CallType;
}

