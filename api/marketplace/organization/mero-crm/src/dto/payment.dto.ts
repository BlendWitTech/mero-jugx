import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty()
    @IsString()
    invoiceId: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    date: Date;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentMode?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdatePaymentDto {
    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    date?: Date;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentMode?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}
