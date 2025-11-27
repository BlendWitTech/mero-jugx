import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationSlugDto {
  @ApiProperty({ 
    description: 'Organization slug (URL-friendly identifier)', 
    example: 'acme-corporation',
    pattern: '^[a-z0-9-]+$'
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;
}

