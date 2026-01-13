import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmPayment } from '@src/database/entities/crm_payments.entity';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto/payment.dto';
import { InvoicesService } from './invoices.service';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(CrmPayment)
        private paymentsRepository: Repository<CrmPayment>,
        private invoicesService: InvoicesService,
    ) { }

    async create(
        userId: string,
        organizationId: string,
        createPaymentDto: CreatePaymentDto,
    ): Promise<CrmPayment> {
        // Verify invoice exists and belongs to organization
        await this.invoicesService.findOne(createPaymentDto.invoiceId, organizationId);

        const payment = this.paymentsRepository.create({
            ...createPaymentDto,
            organizationId,
            createdById: userId,
        });

        const savedPayment = await this.paymentsRepository.save(payment);

        // Update invoice payment status
        await this.invoicesService.updatePaymentStatus(createPaymentDto.invoiceId, organizationId);

        return this.findOne(savedPayment.id, organizationId);
    }

    async findAll(
        organizationId: string,
        page: number = 1,
        limit: number = 10,
        invoiceId?: string,
    ): Promise<{ data: CrmPayment[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        const queryBuilder = this.paymentsRepository
            .createQueryBuilder('payment')
            .where('payment.organizationId = :organizationId', { organizationId })
            .andWhere('payment.removed = :removed', { removed: false })
            .leftJoinAndSelect('payment.invoice', 'invoice')
            .leftJoinAndSelect('invoice.client', 'client')
            .leftJoinAndSelect('payment.createdBy', 'createdBy');

        if (invoiceId) {
            queryBuilder.andWhere('payment.invoiceId = :invoiceId', { invoiceId });
        }

        const [data, total] = await queryBuilder
            .orderBy('payment.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async findOne(id: string, organizationId: string): Promise<CrmPayment> {
        const payment = await this.paymentsRepository.findOne({
            where: { id, organizationId, removed: false },
            relations: ['invoice', 'invoice.client', 'createdBy'],
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${id} not found`);
        }

        return payment;
    }

    async update(
        id: string,
        organizationId: string,
        updatePaymentDto: UpdatePaymentDto,
    ): Promise<CrmPayment> {
        const payment = await this.findOne(id, organizationId);

        Object.assign(payment, updatePaymentDto);

        const updatedPayment = await this.paymentsRepository.save(payment);

        // Update invoice payment status
        await this.invoicesService.updatePaymentStatus(payment.invoiceId, organizationId);

        return this.findOne(updatedPayment.id, organizationId);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const payment = await this.findOne(id, organizationId);
        const invoiceId = payment.invoiceId;

        payment.removed = true;
        await this.paymentsRepository.save(payment);

        // Update invoice payment status
        await this.invoicesService.updatePaymentStatus(invoiceId, organizationId);
    }
}
