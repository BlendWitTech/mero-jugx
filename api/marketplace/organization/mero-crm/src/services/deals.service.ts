import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmDeal } from '@src/database/entities/crm_deals.entity';
import { CreateDealDto, UpdateDealDto } from '../dto/deals.dto';

@Injectable()
export class DealsService {
    constructor(
        @InjectRepository(CrmDeal)
        private dealsRepository: Repository<CrmDeal>,
    ) { }

    async create(createDealDto: CreateDealDto, organizationId: string): Promise<CrmDeal> {
        const deal = this.dealsRepository.create({
            ...createDealDto,
            organizationId,
            assignedToId: createDealDto.assigned_to,
            leadId: createDealDto.lead_id,
        });
        return this.dealsRepository.save(deal);
    }

    async findAll(organizationId: string): Promise<CrmDeal[]> {
        return this.dealsRepository.find({
            where: { organizationId },
            relations: ['assignedTo', 'lead'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<CrmDeal> {
        const deal = await this.dealsRepository.findOne({
            where: { id, organizationId },
            relations: ['assignedTo', 'lead'],
        });

        if (!deal) {
            throw new NotFoundException(`Deal with ID ${id} not found`);
        }

        return deal;
    }

    async update(id: string, updateDealDto: UpdateDealDto, organizationId: string): Promise<CrmDeal> {
        const deal = await this.findOne(id, organizationId);

        if (updateDealDto.assigned_to !== undefined) deal.assignedToId = updateDealDto.assigned_to;
        if (updateDealDto.lead_id !== undefined) deal.leadId = updateDealDto.lead_id;

        Object.assign(deal, updateDealDto);

        return this.dealsRepository.save(deal);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.dealsRepository.delete({ id, organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Deal with ID ${id} not found`);
        }
    }
}
