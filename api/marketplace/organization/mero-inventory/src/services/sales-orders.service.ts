import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { AuditLogsService } from '../../../../../src/audit-logs/audit-logs.service';

@Injectable()
export class SalesOrdersService {
    constructor(
        @InjectRepository(SalesOrder)
        private salesOrderRepository: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem)
        private salesOrderItemRepository: Repository<SalesOrderItem>,
        private auditLogService: AuditLogsService,
    ) { }

    async create(createSalesOrderDto: CreateSalesOrderDto, organizationId: string, userId: string): Promise<SalesOrder> {
        const { items, ...orderData } = createSalesOrderDto;

        // Calculate totals
        let totalAmount = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        const orderItems = items.map(item => {
            const itemTotal = item.quantity * item.unit_price;
            const tax = item.tax_amount || 0;
            const discount = item.discount_amount || 0;
            const finalItemTotal = itemTotal + tax - discount;

            totalAmount += finalItemTotal;
            totalTax += tax;
            totalDiscount += discount;

            return this.salesOrderItemRepository.create({
                ...item,
                total_price: finalItemTotal,
            });
        });

        // Generate Order Number (Simple logic for now, ideally should use a sequence)
        const count = await this.salesOrderRepository.count({ where: { organization_id: organizationId } });
        const orderNumber = `SO-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

        const order = this.salesOrderRepository.create({
            ...orderData,
            customer_id: orderData.customerId,
            order_number: orderNumber,
            organization_id: organizationId,
            created_by: userId,
            total_amount: totalAmount,
            tax_amount: totalTax,
            discount_amount: totalDiscount,
            items: orderItems,
            status: SalesOrderStatus.DRAFT,
        });

        const savedOrder = await this.salesOrderRepository.save(order);

        await this.auditLogService.createAuditLog(
            organizationId,
            userId,
            'CREATE_SALES_ORDER',
            'SALES_ORDER',
            savedOrder.id,
            null,
            savedOrder,
            undefined,
            undefined,
            { orderNumber: savedOrder.order_number }
        );

        return savedOrder;
    }

    async findAll(organizationId: string): Promise<SalesOrder[]> {
        return this.salesOrderRepository.find({
            where: { organization_id: organizationId },
            relations: ['items', 'items.product', 'creator'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<SalesOrder> {
        const order = await this.salesOrderRepository.findOne({
            where: { id, organization_id: organizationId },
            relations: ['items', 'items.product', 'creator'],
        });

        if (!order) {
            throw new NotFoundException(`Sales Order with ID ${id} not found`);
        }
        return order;
    }

    async updateStatus(id: string, status: SalesOrderStatus, organizationId: string, userId: string): Promise<SalesOrder> {
        const order = await this.findOne(id, organizationId);
        const oldStatus = order.status;
        order.status = status;
        const savedOrder = await this.salesOrderRepository.save(order);

        await this.auditLogService.createAuditLog(
            organizationId,
            userId,
            'UPDATE_SALES_ORDER_STATUS',
            'SALES_ORDER',
            savedOrder.id,
            { status: oldStatus },
            { status },
            undefined,
            undefined,
            { oldStatus, newStatus: status }
        );

        return savedOrder;
    }
}
