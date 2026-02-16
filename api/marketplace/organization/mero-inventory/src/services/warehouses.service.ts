
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';

@Injectable()
export class WarehousesService {
    constructor(
        @InjectRepository(Warehouse)
        private warehousesRepository: Repository<Warehouse>,
    ) { }

    async create(createWarehouseDto: CreateWarehouseDto, organizationId: string): Promise<Warehouse> {
        const warehouse = this.warehousesRepository.create({
            ...createWarehouseDto,
            organization_id: organizationId,
        });
        return this.warehousesRepository.save(warehouse);
    }

    async findAll(organizationId: string): Promise<Warehouse[]> {
        return this.warehousesRepository.find({
            where: { organization_id: organizationId },
            order: { created_at: 'ASC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<Warehouse> {
        const warehouse = await this.warehousesRepository.findOne({
            where: { id, organization_id: organizationId },
        });

        if (!warehouse) {
            throw new NotFoundException(`Warehouse with ID "${id}" not found`);
        }

        return warehouse;
    }

    async update(id: string, updateWarehouseDto: UpdateWarehouseDto, organizationId: string): Promise<Warehouse> {
        const warehouse = await this.findOne(id, organizationId);
        Object.assign(warehouse, updateWarehouseDto);
        return this.warehousesRepository.save(warehouse);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const warehouse = await this.findOne(id, organizationId);
        // TODO: Check if warehouse has stock before deleting
        await this.warehousesRepository.remove(warehouse);
    }
}
