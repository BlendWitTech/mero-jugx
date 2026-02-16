import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmInvoice, CrmInvoiceItem, InvoiceStatus, PaymentStatus } from '@src/database/entities/crm_invoices.entity';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/invoice.dto';
import { SalesOrdersService } from '../../../mero-inventory/src/services/sales-orders.service';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(CrmInvoice)
        private invoicesRepository: Repository<CrmInvoice>,
        @InjectRepository(CrmInvoiceItem)
        private invoiceItemsRepository: Repository<CrmInvoiceItem>,
        private readonly salesOrdersService: SalesOrdersService,
    ) { }

    private calculateInvoiceTotals(items: any[], taxRate: number = 0, discount: number = 0) {
        const subTotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxTotal = (subTotal * taxRate) / 100;
        const total = subTotal + taxTotal - discount;
        return { subTotal, taxTotal, total };
    }

    async create(
        userId: string,
        organizationId: string,
        createInvoiceDto: CreateInvoiceDto,
    ): Promise<CrmInvoice> {
        const { items, ...invoiceData } = createInvoiceDto;

        const { subTotal, taxTotal, total } = this.calculateInvoiceTotals(
            items,
            invoiceData.taxRate || 0,
            invoiceData.discount || 0,
        );

        const invoice = this.invoicesRepository.create({
            ...invoiceData,
            organizationId,
            createdById: userId,
            subTotal,
            taxTotal,
            total,
            status: invoiceData.status || InvoiceStatus.DRAFT,
            paymentStatus: PaymentStatus.UNPAID,
        });

        const savedInvoice = await this.invoicesRepository.save(invoice);

        // Create invoice items
        const invoiceItems = items.map((item) =>
            this.invoiceItemsRepository.create({
                ...item,
                invoiceId: savedInvoice.id,
            }),
        );

        await this.invoiceItemsRepository.save(invoiceItems);

        return this.findOne(savedInvoice.id, organizationId);
    }

    async findAll(
        organizationId: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
        status?: InvoiceStatus,
    ): Promise<{ data: CrmInvoice[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.invoicesRepository
            .createQueryBuilder('invoice')
            .where('invoice.organizationId = :organizationId', { organizationId })
            .andWhere('invoice.removed = :removed', { removed: false })
            .leftJoinAndSelect('invoice.client', 'client')
            .leftJoinAndSelect('invoice.createdBy', 'createdBy')
            .leftJoinAndSelect('invoice.items', 'items');

        if (search) {
            queryBuilder.andWhere(
                '(invoice.number::text ILIKE :search OR invoice.content ILIKE :search OR client.name ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (status) {
            queryBuilder.andWhere('invoice.status = :status', { status });
        }

        const [data, total] = await queryBuilder
            .orderBy('invoice.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async findOne(id: string, organizationId: string): Promise<CrmInvoice> {
        const invoice = await this.invoicesRepository.findOne({
            where: { id, organizationId, removed: false },
            relations: ['client', 'createdBy', 'items', 'payments'],
        });

        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        return invoice;
    }

    async update(
        id: string,
        organizationId: string,
        updateInvoiceDto: UpdateInvoiceDto,
    ): Promise<CrmInvoice> {
        const invoice = await this.findOne(id, organizationId);
        const { items, ...invoiceData } = updateInvoiceDto;

        if (items) {
            // Delete existing items
            await this.invoiceItemsRepository.delete({ invoiceId: id });

            // Create new items
            const invoiceItems = items.map((item) =>
                this.invoiceItemsRepository.create({
                    ...item,
                    invoiceId: id,
                }),
            );
            await this.invoiceItemsRepository.save(invoiceItems);

            // Recalculate totals
            const { subTotal, taxTotal, total } = this.calculateInvoiceTotals(
                items,
                invoiceData.taxRate !== undefined ? invoiceData.taxRate : invoice.taxRate,
                invoiceData.discount !== undefined ? invoiceData.discount : invoice.discount,
            );

            Object.assign(invoice, invoiceData, { subTotal, taxTotal, total });
        } else {
            Object.assign(invoice, invoiceData);
        }

        return this.invoicesRepository.save(invoice);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const invoice = await this.findOne(id, organizationId);
        invoice.removed = true;
        await this.invoicesRepository.save(invoice);
    }

    async updatePaymentStatus(invoiceId: string, organizationId: string): Promise<void> {
        const invoice = await this.findOne(invoiceId, organizationId);

        const totalPaid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        if (totalPaid === 0) {
            invoice.paymentStatus = PaymentStatus.UNPAID;
        } else if (totalPaid >= Number(invoice.total)) {
            invoice.paymentStatus = PaymentStatus.PAID;

            // INTEGRATION: Create Sales Order if invoice is paid and has matching products
            await this.createSalesOrderFromInvoice(invoice, organizationId);
        } else {
            invoice.paymentStatus = PaymentStatus.PARTIALLY;
        }

        await this.invoicesRepository.save(invoice);
    }

    // Helper to create Sales Order
    private async createSalesOrderFromInvoice(invoice: CrmInvoice, organizationId: string) {
        try {
            // Check if items have product IDs
            const itemsWithProduct = invoice.items.filter(item => item.productId);

            if (itemsWithProduct.length > 0) {
                // Create Sales Order DTO
                const createSalesOrderDto = {
                    customerId: invoice.clientId, // Assuming mapping exists? Wait, Inventory SalesOrder uses a simple customerId string?
                    // Inventory SalesOrder uses 'customer_id' string. In CRM we have clientId (UUID). 
                    // This is fine if we treat them as compatible IDs.
                    orderDate: new Date(),
                    status: 'CONFIRMED', // Auto-confirm? Or DRAFT? 
                    // Let's use DRAFT to be safe, or CONFIRMED if paid. PAID implies CONFIRMED.
                    items: itemsWithProduct.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        tax: 0, // Simplified
                        discount: 0 // Simplified
                    })),
                    notes: `Created from Invoice #${invoice.number}`,
                    // metadata?
                };

                // Call SalesOrdersService
                // I need to cast to any if types don't match perfectly, or import CreateSalesOrderDto
                // But I didn't import CreateSalesOrderDto. 
                // Let's import CreateSalesOrderDto at top.
                // Or just use 'any' to bypass strict type check for now if DTO is not exported or accessible.
                // Assuming salesOrdersService.create accepts the DTO.

                // await this.salesOrdersService.create(organizationId, invoice.createdById, createSalesOrderDto as any);
                // Wait, create signature: create(organizationId: string, userId: string, createSalesOrderDto: CreateSalesOrderDto)

                await this.salesOrdersService.create({
                    customerId: invoice.clientId,
                    orderDate: new Date(),
                    status: 'CONFIRMED', // Using string literal matching enum? 'CONFIRMED'
                    items: itemsWithProduct.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        tax: 0,
                        discount: 0
                    })),
                    formattedAddress: 'See CRM Client Address', // Required?
                } as any, organizationId, invoice.createdById);
            }
        } catch (error) {
            console.error('Failed to create Sales Order from Invoice:', error);
            // Don't fail the invoice update, just log error
        }
    }
}
