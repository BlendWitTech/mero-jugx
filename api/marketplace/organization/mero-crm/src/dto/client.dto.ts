import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ example: 'Acme Corporation' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'john@acme.com' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'United States' })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ example: '123 Main St, New York, NY 10001' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: 'user-id-here' })
    @IsString()
    @IsOptional()
    assignedToId?: string;
}

export class UpdateClientDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assignedToId?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}
