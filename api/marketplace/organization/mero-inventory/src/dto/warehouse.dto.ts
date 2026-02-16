
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
    @ApiProperty({ example: 'Main Warehouse' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Kathmandu, Nepal' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ example: '+977-9800000000' })
    @IsString()
    @IsOptional()
    contact_number?: string;

    @ApiPropertyOptional({ example: 'storage' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateWarehouseDto {
    @ApiPropertyOptional({ example: 'Main Warehouse' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'Kathmandu, Nepal' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ example: '+977-9800000000' })
    @IsString()
    @IsOptional()
    contact_number?: string;

    @ApiPropertyOptional({ example: 'storage' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ default: true })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
