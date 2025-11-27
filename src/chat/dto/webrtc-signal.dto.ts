import { IsString, IsOptional, IsObject } from 'class-validator';

export class WebRTCSignalDto {
  @IsString()
  type: 'offer' | 'answer' | 'ice-candidate';

  @IsString()
  @IsOptional()
  sdp?: string;

  @IsObject()
  @IsOptional()
  candidate?: any; // ICE candidate
}

