import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectRepository(Supplier)
        private suppliersRepository: Repository<Supplier>,
    ) { }

    async create(organizationId: string, data: Partial<Supplier>): Promise<Supplier> {
        const supplier = this.suppliersRepository.create({
            ...data,
            organizationId,
        });
        return this.suppliersRepository.save(supplier);
    }

    async findAll(organizationId: string): Promise<Supplier[]> {
        return this.suppliersRepository.find({
            where: { organizationId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(organizationId: string, id: string): Promise<Supplier> {
        const supplier = await this.suppliersRepository.findOne({
            where: { id, organizationId },
        });

        if (!supplier) {
            throw new NotFoundException('Supplier not found');
        }

        return supplier;
    }

    async update(organizationId: string, id: string, data: Partial<Supplier>): Promise<Supplier> {
        const supplier = await this.findOne(organizationId, id);
        Object.assign(supplier, data);
        return this.suppliersRepository.save(supplier);
    }

    async remove(organizationId: string, id: string): Promise<void> {
        const supplier = await this.findOne(organizationId, id);
        await this.suppliersRepository.remove(supplier);
    }
}
