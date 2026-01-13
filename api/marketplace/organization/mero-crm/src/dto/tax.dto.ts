import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxDto {
    @ApiProperty({ example: 'VAT' })
    @IsString()
    taxName: string;

    @ApiProperty({ example: 13 })
    @IsNumber()
    taxValue: number;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class UpdateTaxDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    taxName?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    taxValue?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}
