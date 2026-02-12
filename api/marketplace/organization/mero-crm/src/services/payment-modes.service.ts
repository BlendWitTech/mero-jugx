import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmPaymentMode } from '../../../../src/database/entities/crm_payment_modes.entity';
import { CreatePaymentModeDto, UpdatePaymentModeDto } from '../dto/payment-mode.dto';

@Injectable()
export class PaymentModesService {
    constructor(
        @InjectRepository(CrmPaymentMode)
        private paymentModesRepository: Repository<CrmPaymentMode>,
    ) { }

    async create(
        organizationId: string,
        createPaymentModeDto: CreatePaymentModeDto,
    ): Promise<CrmPaymentMode> {
        if (createPaymentModeDto.isDefault) {
            await this.paymentModesRepository.update(
                { organizationId, isDefault: true },
                { isDefault: false },
            );
        }

        const paymentMode = this.paymentModesRepository.create({
            ...createPaymentModeDto,
            organizationId,
        });

        return this.paymentModesRepository.save(paymentMode);
    }

    async findAll(
        organizationId: string,
        enabledOnly: boolean = false,
    ): Promise<CrmPaymentMode[]> {
        const where: any = { organizationId, removed: false };
        if (enabledOnly) {
            where.enabled = true;
        }

        return this.paymentModesRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, organizationId: string): Promise<CrmPaymentMode> {
        const paymentMode = await this.paymentModesRepository.findOne({
            where: { id, organizationId, removed: false },
        });

        if (!paymentMode) {
            throw new NotFoundException(`Payment mode with ID ${id} not found`);
        }

        return paymentMode;
    }

    async update(
        id: string,
        organizationId: string,
        updatePaymentModeDto: UpdatePaymentModeDto,
    ): Promise<CrmPaymentMode> {
        const paymentMode = await this.findOne(id, organizationId);

        if (updatePaymentModeDto.isDefault && !paymentMode.isDefault) {
            await this.paymentModesRepository.update(
                { organizationId, isDefault: true },
                { isDefault: false },
            );
        }

        Object.assign(paymentMode, updatePaymentModeDto);

        return this.paymentModesRepository.save(paymentMode);
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const paymentMode = await this.findOne(id, organizationId);
        paymentMode.removed = true;
        await this.paymentModesRepository.save(paymentMode);
    }
}
