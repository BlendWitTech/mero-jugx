import { PartialType } from '@nestjs/swagger';
import { CreateAppDto } from './create-app.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppStatus } from '../../database/entities/apps.entity';

export class UpdateAppDto extends PartialType(CreateAppDto) {
  @ApiPropertyOptional({
    description: 'App status',
    enum: AppStatus,
  })
  @IsEnum(AppStatus)
  @IsOptional()
  status?: AppStatus;
}

