import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCrmSettingDto {
    @ApiProperty({ example: 'crm_logo' })
    @IsString()
    settingKey: string;

    @ApiProperty({ example: 'https://example.com/logo.png' })
    @IsString()
    settingValue: string;
}

export class BatchUpdateCrmSettingsDto {
    @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
    settings: Record<string, string>;
}
