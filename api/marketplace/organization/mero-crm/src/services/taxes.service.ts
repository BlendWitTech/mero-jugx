import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmTax } from '@src/database/entities/crm_taxes.entity';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';

@Injectable()
export class TaxesService {
    constructor(
        @InjectRepository(CrmTax)
        private taxesRepository: Repository<CrmTax>,
    ) { }

    async create(
        organizationId: string,
        createTaxDto: CreateTaxDto,
    ): Promise<CrmTax> {
        // If this is set as default, unset other defaults for this organization
        if (createTaxDto.isDefault) {
            await this.taxesRepository.update(
                { organizationId, isDefault: true },
                { isDefault: false },
            );
        }

        const tax = this.taxesRepository.create({
            ...createTaxDto,
            organizationId,
        });

        return this.taxesRepository.save(tax);
    }

    async findAll(
        organizationId: string,
        enabledOnly: boolean = false,
    ): Promise<CrmTax[]> {
        const where: any = { organizationId, removed: false };
        if (enabledOnly) {
            where.enabled = true;
        }

        return this.taxesRepository.find({
            where,
            order: { taxName: 'ASC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<CrmTax> {
        const tax = await this.taxesRepository.findOne({
            where: { id, organizationId, removed: false },
        });

        if (!tax) {
            throw new NotFoundException(`Tax with ID ${id} not found`);
        }

        return tax;
    }

    async update(
        id: string,
        organizationId: string,
        updateTaxDto: UpdateTaxDto,
    ): Promise<CrmTax> {
        const tax = await this.findOne(id, organizationId);

        if (updateTaxDto.isDefault && !tax.isDefault) {
            await this.taxesRepository.update(
                { organizationId, isDefault: true },
                { isDefault: false },
            );
        }

        Object.assign(tax, updateTaxDto);

        return this.taxesRepository.save(tax);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const tax = await this.findOne(id, organizationId);
        tax.removed = true;
        await this.taxesRepository.save(tax);
    }
}
