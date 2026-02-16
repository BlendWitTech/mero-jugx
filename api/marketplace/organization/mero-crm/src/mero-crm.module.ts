import { Module } from '@nestjs/common';
import { ClientsModule } from './modules/clients.module';
import { InvoicesModule } from './modules/invoices.module';
import { PaymentsModule } from './modules/payments.module';
import { TaxesModule } from './modules/taxes.module';
import { PaymentModesModule } from './modules/payment-modes.module';
import { QuotesModule } from './modules/quotes.module';
import { CrmSettingsModule } from './modules/settings.module';
import { LeadsModule } from './modules/leads.module';
import { DealsModule } from './modules/deals.module';
import { ActivitiesModule } from './modules/activities.module';

@Module({
    imports: [
        ClientsModule,
        InvoicesModule,
        PaymentsModule,
        TaxesModule,
        PaymentModesModule,
        QuotesModule,
        CrmSettingsModule,
        LeadsModule,
        DealsModule,
        ActivitiesModule,
    ],
    exports: [
        ClientsModule,
        InvoicesModule,
        PaymentsModule,
        TaxesModule,
        PaymentModesModule,
        QuotesModule,
        CrmSettingsModule,
        LeadsModule,
        DealsModule,
        ActivitiesModule,
    ],
})
export class MeroCrmModule { }
