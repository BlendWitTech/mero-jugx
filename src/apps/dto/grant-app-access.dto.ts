import { IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantAppAccessDto {
  @ApiProperty({ description: 'User ID to grant access to' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'App ID to grant access to' })
  @IsInt()
  app_id: number;
}

