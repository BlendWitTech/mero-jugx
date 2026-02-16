import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { StockAdjustmentItem } from '../entities/stock-adjustment-item.entity';
import { Stock } from '../entities/stock.entity';
import { StockMovement, StockMovementType } from '../entities/stock-movement.entity';

@Injectable()
export class StockAdjustmentsService {
    constructor(
        @InjectRepository(StockAdjustment)
        private stockAdjustmentRepository: Repository<StockAdjustment>,
        @InjectRepository(StockAdjustmentItem)
        private stockAdjustmentItemRepository: Repository<StockAdjustmentItem>,
        private dataSource: DataSource,
    ) { }

    async create(data: Partial<StockAdjustment>, organizationId: string): Promise<StockAdjustment> {
        const adjustment = this.stockAdjustmentRepository.create({
            ...data,
            organizationId,
            status: 'DRAFT',
        });
        return this.stockAdjustmentRepository.save(adjustment);
    }

    async findAll(organizationId: string): Promise<StockAdjustment[]> {
        return this.stockAdjustmentRepository.find({
            where: { organizationId },
            order: { createdAt: 'DESC' },
            relations: ['warehouse', 'createdBy', 'approvedBy'],
        });
    }

    async findOne(id: string, organizationId: string): Promise<StockAdjustment> {
        const adjustment = await this.stockAdjustmentRepository.findOne({
            where: { id, organizationId },
            relations: ['items', 'items.product', 'warehouse', 'createdBy', 'approvedBy'],
        });

        if (!adjustment) {
            throw new NotFoundException(`Stock adjustment with ID ${id} not found`);
        }

        return adjustment;
    }

    async update(id: string, data: any, organizationId: string): Promise<StockAdjustment> {
        const adjustment = await this.findOne(id, organizationId);

        if (adjustment.status !== 'DRAFT') {
            throw new BadRequestException('Only draft adjustments can be updated');
        }

        // Update basic fields
        if (data.adjustmentDate) adjustment.adjustmentDate = data.adjustmentDate;
        if (data.reason) adjustment.reason = data.reason;
        if (data.notes) adjustment.notes = data.notes;

        // Handle Items if provided
        if (data.items) {
            // Delete existing items
            await this.stockAdjustmentItemRepository.delete({ adjustmentId: id });

            // Create new items
            const newItems = data.items.map(item => this.stockAdjustmentItemRepository.create({
                ...item,
                adjustmentId: id,
                difference: item.actualQuantity - item.systemQuantity
            }));
            adjustment.items = newItems;
        }

        return this.stockAdjustmentRepository.save(adjustment);
    }

    async approve(id: string, userId: string, organizationId: string): Promise<StockAdjustment> {
        const adjustment = await this.findOne(id, organizationId);

        if (adjustment.status !== 'DRAFT') {
            throw new BadRequestException('Only draft adjustments can be approved');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Update Adjustment Status
            adjustment.status = 'APPROVED';
            adjustment.approvedById = userId;
            adjustment.approvedAt = new Date();
            await queryRunner.manager.save(adjustment);

            // 2. Process each item
            for (const item of adjustment.items) {
                // Update Stock
                let stock = await queryRunner.manager.findOne(Stock, {
                    where: { productId: item.productId, warehouseId: adjustment.warehouseId }
                });

                if (!stock) {
                    stock = queryRunner.manager.create(Stock, {
                        productId: item.productId,
                        warehouseId: adjustment.warehouseId,
                        quantity: 0
                    });
                }

                // Update quantity to match actual
                stock.quantity = item.actualQuantity;
                await queryRunner.manager.save(stock);

                // Create Stock Movement Log
                const movement = queryRunner.manager.create(StockMovement, {
                    organizationId,
                    productId: item.productId,
                    warehouseId: adjustment.warehouseId,
                    type: StockMovementType.ADJUSTMENT,
                    quantity: item.difference, // The change amount
                    referenceType: 'ADJUSTMENT',
                    referenceId: adjustment.id,
                    notes: `Stock Adjustment ${adjustment.adjustmentNumber}: ${item.notes || ''}`,
                    createdById: userId
                });
                await queryRunner.manager.save(movement);
            }

            await queryRunner.commitTransaction();
            return adjustment;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const adjustment = await this.findOne(id, organizationId);
        if (adjustment.status !== 'DRAFT') {
            throw new BadRequestException('Only draft adjustments can be deleted');
        }
        await this.stockAdjustmentRepository.remove(adjustment);
    }
}
