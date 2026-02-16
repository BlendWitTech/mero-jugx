import { IsInt, IsUUID, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantAppAccessDto {
  @ApiProperty({ description: 'User ID to grant access to' })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ description: 'Role ID for the app context', required: false })
  @IsNumber()
  @IsOptional()
  role_id?: number;

  @ApiProperty({ description: 'App ID to grant access to' })
  @IsInt()
  app_id: number;
}
