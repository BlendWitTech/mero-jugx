import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
    @ApiProperty({ description: 'Branch name' })
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Branch email (defaults to parent if not provided)' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Branch phone' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Branch address' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'City' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'State/Province' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Country' })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiPropertyOptional({ description: 'Default currency' })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    currency?: string;
}
