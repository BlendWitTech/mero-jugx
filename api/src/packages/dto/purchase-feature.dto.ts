import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseFeatureDto {
  @ApiProperty({ description: 'Package Feature ID to purchase' })
  @IsInt()
  @IsNotEmpty()
  package_feature_id: number;
}
