import { IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyStatus } from '../../database/entities/api-key.entity';

export class UpdateApiKeyDto {
  @ApiPropertyOptional({
    description: 'API key name',
    example: 'Updated API Key Name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'API key description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'API key status',
    enum: ApiKeyStatus,
  })
  @IsOptional()
  @IsEnum(ApiKeyStatus)
  status?: ApiKeyStatus;

  @ApiPropertyOptional({
    description: 'Scoped permissions for this API key',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[] | null;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string | null;
}

