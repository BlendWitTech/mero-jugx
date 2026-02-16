import { IsInt, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppAccessDto {
    @ApiProperty({ description: 'User ID to update access for' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ description: 'App ID (for validation)' })
    @IsInt()
    app_id: number;

    @ApiProperty({ description: 'New Role ID for the app context', required: true })
    @IsInt()
    role_id: number;
}
