import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTaskAttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ description: 'File URL' })
  @IsUrl()
  @MaxLength(500)
  file_url: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  @MaxLength(100)
  file_type: string;

  @ApiProperty({ description: 'File size in bytes' })
  file_size: number;

  @ApiPropertyOptional({ description: 'Thumbnail URL for images' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  thumbnail_url?: string;
}

