import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradePackageDto {
  @ApiProperty({ description: 'Package ID to upgrade to' })
  @IsInt()
  @IsNotEmpty()
  package_id: number;
}

