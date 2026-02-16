import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, Min, Max } from 'class-validator';

export class CreateDealDto {
    @IsString()
    title: string;

    @IsNumber()
    @Min(0)
    value: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    stage?: string;

    @IsOptional()
    @IsDateString()
    expected_close_date?: string;

    @IsOptional()
    @IsUUID()
    lead_id?: string;

    @IsOptional()
    @IsUUID()
    assigned_to?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    probability?: number;

    @IsOptional()
    @IsEnum(['OPEN', 'WON', 'LOST'])
    status?: string;
}

export class UpdateDealDto extends CreateDealDto { }
