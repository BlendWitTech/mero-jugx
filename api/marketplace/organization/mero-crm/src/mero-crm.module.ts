import { Module } from '@nestjs/common';
import { ClientsModule } from './modules/clients.module';
import { InvoicesModule } from './modules/invoices.module';
import { PaymentsModule } from './modules/payments.module';
import { TaxesModule } from './modules/taxes.module';
import { PaymentModesModule } from './modules/payment-modes.module';
import { QuotesModule } from './modules/quotes.module';
import { CrmSettingsModule } from './modules/settings.module';

@Module({
    imports: [
        ClientsModule,
        InvoicesModule,
        PaymentsModule,
        TaxesModule,
        PaymentModesModule,
        QuotesModule,
        CrmSettingsModule,
    ],
    exports: [
        ClientsModule,
        InvoicesModule,
        PaymentsModule,
        TaxesModule,
        PaymentModesModule,
        QuotesModule,
        CrmSettingsModule,
    ],
})
export class MeroCrmModule { }
