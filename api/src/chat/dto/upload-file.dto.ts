import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    description: 'File name',
    example: 'document.pdf',
  })
  @IsString()
  file_name: string;

  @ApiProperty({
    description: 'File type (MIME type)',
    example: 'application/pdf',
  })
  @IsString()
  file_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: '1024000',
  })
  @IsString()
  file_size: string;

  @ApiPropertyOptional({
    description: 'Thumbnail URL (for images/videos)',
    example: 'https://example.com/thumb.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;
}

