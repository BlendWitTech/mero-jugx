import { IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeAppAccessDto {
  @ApiProperty({ description: 'User ID to revoke access from' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'App ID to revoke access from' })
  @IsInt()
  app_id: number;
}

