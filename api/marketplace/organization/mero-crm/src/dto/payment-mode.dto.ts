import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentModeDto {
    @ApiProperty({ example: 'Bank Transfer' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Transfer funds directly to bank account' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class UpdatePaymentModeDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}
