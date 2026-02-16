import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateBoardColumnDto {
    @IsString()
    name: string;

    @IsInt()
    position: number;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsInt()
    wip_limit?: number;
}

export class UpdateBoardColumnDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsInt()
    position?: number;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsInt()
    wip_limit?: number;
}
