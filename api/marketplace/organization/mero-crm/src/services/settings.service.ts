import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmSetting } from '@src/database/entities/crm_settings.entity';
import { BatchUpdateCrmSettingsDto } from '../dto/setting.dto';

@Injectable()
export class CrmSettingsService {
    constructor(
        @InjectRepository(CrmSetting)
        private settingsRepository: Repository<CrmSetting>,
    ) { }

    async findAll(organizationId: string): Promise<Record<string, string>> {
        const settings = await this.settingsRepository.find({
            where: { organizationId },
        });

        return settings.reduce((acc, setting) => {
            acc[setting.settingKey] = setting.settingValue;
            return acc;
        }, {} as Record<string, string>);
    }

    async findOne(organizationId: string, settingKey: string): Promise<string | null> {
        const setting = await this.settingsRepository.findOne({
            where: { organizationId, settingKey },
        });

        return setting ? setting.settingValue : null;
    }

    async update(
        organizationId: string,
        settingKey: string,
        settingValue: string,
    ): Promise<CrmSetting> {
        let setting = await this.settingsRepository.findOne({
            where: { organizationId, settingKey },
        });

        if (setting) {
            setting.settingValue = settingValue;
        } else {
            setting = this.settingsRepository.create({
                organizationId,
                settingKey,
                settingValue,
            });
        }

        return this.settingsRepository.save(setting);
    }

    async batchUpdate(
        organizationId: string,
        batchUpdateCrmSettingsDto: BatchUpdateCrmSettingsDto,
    ): Promise<Record<string, string>> {
        const { settings } = batchUpdateCrmSettingsDto;

        for (const [key, value] of Object.entries(settings)) {
            await this.update(organizationId, key, value);
        }

        return this.findAll(organizationId);
    }
}
