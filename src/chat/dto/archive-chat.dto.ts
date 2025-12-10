import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ArchiveChatDto {
  @ApiPropertyOptional({
    description: 'Whether to archive (true) or unarchive (false)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  archive?: boolean = true;
}

