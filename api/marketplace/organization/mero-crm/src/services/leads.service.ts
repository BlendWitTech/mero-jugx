import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmLead } from '@src/database/entities/crm_leads.entity';
import { CreateLeadDto, UpdateLeadDto } from '../dto/leads.dto';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(CrmLead)
        private leadsRepository: Repository<CrmLead>,
    ) { }

    async create(createLeadDto: CreateLeadDto, organizationId: string): Promise<CrmLead> {
        const lead = this.leadsRepository.create({
            ...createLeadDto,
            organizationId,
            assignedToId: createLeadDto.assigned_to,
        });
        return this.leadsRepository.save(lead);
    }

    async findAll(organizationId: string): Promise<CrmLead[]> {
        return this.leadsRepository.find({
            where: { organizationId },
            relations: ['assignedTo'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<CrmLead> {
        const lead = await this.leadsRepository.findOne({
            where: { id, organizationId },
            relations: ['assignedTo'],
        });

        if (!lead) {
            throw new NotFoundException(`Lead with ID ${id} not found`);
        }

        return lead;
    }

    async update(id: string, updateLeadDto: UpdateLeadDto, organizationId: string): Promise<CrmLead> {
        const lead = await this.findOne(id, organizationId);

        if (updateLeadDto.assigned_to) {
            lead.assignedToId = updateLeadDto.assigned_to;
        }

        Object.assign(lead, {
            ...updateLeadDto,
            assignedToId: updateLeadDto.assigned_to !== undefined ? updateLeadDto.assigned_to : lead.assignedToId
        });

        return this.leadsRepository.save(lead);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.leadsRepository.delete({ id, organizationId });
        if (result.affected === 0) {
            throw new NotFoundException(`Lead with ID ${id} not found`);
        }
    }
}
