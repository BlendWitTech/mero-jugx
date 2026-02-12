import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CrmClient } from '../../../../src/database/entities/crm_clients.entity';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(CrmClient)
        private clientsRepository: Repository<CrmClient>,
    ) { }

    async create(
        userId: string,
        organizationId: string,
        createClientDto: CreateClientDto,
    ): Promise<CrmClient> {
        const client = this.clientsRepository.create({
            ...createClientDto,
            organizationId,
            createdById: userId,
        });

        return this.clientsRepository.save(client);
    }

    async findAll(
        organizationId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
    ): Promise<{ data: CrmClient[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.clientsRepository
            .createQueryBuilder('client')
            .where('client.organizationId = :organizationId', { organizationId })
            .andWhere('client.removed = :removed', { removed: false })
            .leftJoinAndSelect('client.createdBy', 'createdBy')
            .leftJoinAndSelect('client.assignedTo', 'assignedTo');

        if (search) {
            queryBuilder.andWhere(
                '(client.name ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [data, total] = await queryBuilder
            .orderBy('client.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async findOne(id: string, organizationId: string): Promise<CrmClient> {
        const client = await this.clientsRepository.findOne({
            where: { id, organizationId, removed: false },
            relations: ['createdBy', 'assignedTo', 'invoices'],
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        return client;
    }

    async update(
        id: string,
        organizationId: string,
        updateClientDto: UpdateClientDto,
    ): Promise<CrmClient> {
        const client = await this.findOne(id, organizationId);

        Object.assign(client, updateClientDto);

        return this.clientsRepository.save(client);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const client = await this.findOne(id, organizationId);
        client.removed = true;
        await this.clientsRepository.save(client);
    }

    async restore(id: string, organizationId: string): Promise<CrmClient> {
        const client = await this.clientsRepository.findOne({
            where: { id, organizationId },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${id} not found`);
        }

        client.removed = false;
        return this.clientsRepository.save(client);
    }
}
