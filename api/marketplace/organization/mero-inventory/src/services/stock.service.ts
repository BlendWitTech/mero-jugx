import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { StockMovement, StockMovementType } from '../entities/stock-movement.entity';

@Injectable()
export class StockService {
    constructor(
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
    ) { }

    async getStock(productId: string, warehouseId: string): Promise<Stock | null> {
        return this.stockRepository.findOne({ where: { productId: productId, warehouseId: warehouseId } });
    }

    async adjustStock(
        productId: string,
        warehouseId: string,
        quantity: number,
        type: StockMovementType,
        reason: string,
        referenceId: string, // e.g., Order ID or Shipment ID
        userId: string,
        organizationId: string
    ): Promise<Stock> {
        let stock = await this.getStock(productId, warehouseId);

        if (!stock) {
            // If adding stock, create record. If removing, might throw error or allow negative?
            if (type === StockMovementType.IN) {
                stock = this.stockRepository.create({
                    productId: productId,
                    warehouseId: warehouseId,
                    quantity: 0,
                    // organization_id not in Stock entity? Check again. 
                    // Stock entity has no organizationId column in the file I viewed!
                    // It has productId, warehouseId, quantity. 
                    // Let's assume for now we don't need orgId on Stock itself if accessed via Warehouse, 
                    // or I missed it. The viewed file showed IDs 1-34, no orgId.
                });
            } else {
                throw new NotFoundException('Stock record not found for this product in the specified warehouse');
            }
        }

        if (type === StockMovementType.OUT && stock.quantity < quantity) {
            throw new BadRequestException(`Insufficient stock. Available: ${stock.quantity}, Required: ${quantity}`);
        }

        // Update quantity
        if (type === StockMovementType.IN) {
            stock.quantity += quantity;
        } else {
            stock.quantity -= quantity;
        }

        const savedStock = await this.stockRepository.save(stock);

        // Record Movement
        const movement = this.stockMovementRepository.create({
            // stockId: savedStock.id, // Not in entity
            productId: productId,
            warehouseId: warehouseId,
            type,
            quantity,
            notes: reason, // Mapped reason to notes
            referenceId: referenceId,
            createdById: userId,
            organizationId: organizationId,
        });

        await this.stockMovementRepository.save(movement);

        return savedStock;
    }
}
