import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchOrganizationDto {
  @ApiProperty({ description: 'Organization ID to switch to' })
  @IsUUID()
  @IsNotEmpty()
  organization_id: string;
}
