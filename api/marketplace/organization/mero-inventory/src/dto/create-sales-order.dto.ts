import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SalesOrderItemDto {
    @ApiProperty()
    @IsUUID()
    product_id: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    unit_price: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    tax_amount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    discount_amount?: number;
}

export class CreateSalesOrderDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customerId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customer_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customer_email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    order_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    expected_shipment_date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ type: [SalesOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalesOrderItemDto)
    items: SalesOrderItemDto[];
}
