import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '@src/database/entities/crm_quotes.entity';

export class CreateQuoteItemDto {
    @ApiProperty({ example: 'Item name' })
    @IsString()
    itemName: string;

    @ApiPropertyOptional({ example: 'Item description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    quantity: number;

    @ApiProperty({ example: 100 })
    @IsNumber()
    price: number;
}

export class CreateQuoteDto {
    @ApiProperty({ example: '2024-01-01' })
    @IsDateString()
    date: string;

    @ApiProperty({ example: '2024-02-01' })
    @IsDateString()
    expiredDate: string;

    @ApiProperty({ example: 'client-uuid-here' })
    @IsString()
    clientId: string;

    @ApiProperty({ type: [CreateQuoteItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items: CreateQuoteItemDto[];

    @ApiPropertyOptional({ example: 0 })
    @IsNumber()
    @IsOptional()
    taxRate?: number;

    @ApiPropertyOptional({ example: 0 })
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiPropertyOptional({ example: 'USD' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiPropertyOptional({ example: 'Some notes' })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateQuoteDto {
    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    expiredDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({ type: [CreateQuoteItemDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items?: CreateQuoteItemDto[];

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
    status?: QuoteStatus;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}
