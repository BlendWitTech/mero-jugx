import { IsString, IsNumber, IsDate, IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentStatus } from '@src/database/entities/crm_invoices.entity';

export class InvoiceItemDto {
    @ApiProperty()
    @IsString()
    itemName: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsNumber()
    total: number;
}

export class CreateInvoiceDto {
    @ApiProperty()
    @IsString()
    clientId: string;

    @ApiProperty()
    @IsNumber()
    number: number;

    @ApiProperty()
    @IsNumber()
    year: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    date: Date;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    expiredDate: Date;

    @ApiProperty({ type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    taxRate?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiProperty()
    @IsString()
    currency: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ enum: InvoiceStatus })
    @IsEnum(InvoiceStatus)
    @IsOptional()
    status?: InvoiceStatus;
}

export class UpdateInvoiceDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    date?: Date;

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    expiredDate?: Date;

    @ApiPropertyOptional({ type: [InvoiceItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @IsOptional()
    items?: InvoiceItemDto[];

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    taxRate?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ enum: InvoiceStatus })
    @IsEnum(InvoiceStatus)
    @IsOptional()
    status?: InvoiceStatus;

    @ApiPropertyOptional({ enum: PaymentStatus })
    @IsEnum(PaymentStatus)
    @IsOptional()
    paymentStatus?: PaymentStatus;
}
