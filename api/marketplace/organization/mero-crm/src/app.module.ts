import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseConfig } from '../../../../src/config/database.config';
import { AuthModule } from '../../../../src/auth/auth.module';
import { CommonModule } from '../../../../src/common/common.module';
import { UsersModule } from '../../../../src/users/users.module';
import { ClientsModule } from './modules/clients.module';
import { InvoicesModule } from './modules/invoices.module';
import { PaymentsModule } from './modules/payments.module';
import { TaxesModule } from './modules/taxes.module';
import { PaymentModesModule } from './modules/payment-modes.module';
import { QuotesModule } from './modules/quotes.module';
import { CrmSettingsModule } from './modules/settings.module';

@Module({
    imports: [
        // Configuration module
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../../.env',
        }),

        // Database module
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const dbConfig = new DatabaseConfig(configService);
                const options = dbConfig.createTypeOrmOptions();
                if (options.extra) {
                    options.extra.application_name = 'mero-crm-api';
                }
                return options;
            },
            inject: [ConfigService],
        }),

        // Rate limiting
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),

        CommonModule,
        AuthModule,
        UsersModule,

        // CRM Modules
        ClientsModule,
        InvoicesModule,
        PaymentsModule,
        TaxesModule,
        PaymentModesModule,
        QuotesModule,
        CrmSettingsModule,
    ],
})
export class CrmAppModule { }
