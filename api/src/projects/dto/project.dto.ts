import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsUUID()
    @IsNotEmpty()
    workspace_id: string;
}

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
