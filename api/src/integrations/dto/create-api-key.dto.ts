import { IsString, IsOptional, IsArray, IsDateString, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'API key name',
    example: 'Production API Key',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'API key description',
    example: 'API key for production environment',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Scoped permissions for this API key',
    type: [String],
    example: ['users.view', 'users.create'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[] | null;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string | null;
}

