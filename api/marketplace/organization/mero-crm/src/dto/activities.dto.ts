import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';

export class CreateActivityDto {
    @IsEnum(['CALL', 'MEETING', 'TASK', 'EMAIL', 'NOTE'])
    type: string;

    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    due_date?: string;

    @IsOptional()
    @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED'])
    status?: string;

    @IsOptional()
    @IsUUID()
    lead_id?: string;

    @IsOptional()
    @IsUUID()
    deal_id?: string;

    @IsOptional()
    @IsUUID()
    assigned_to?: string;
}

export class UpdateActivityDto extends CreateActivityDto { }
