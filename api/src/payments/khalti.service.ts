import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KhaltiService {
    private readonly logger = new Logger(KhaltiService.name);
    private readonly secretKey: string;
    private readonly gatewayUrl: string;
    private readonly websiteUrl: string;
    private readonly returnUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.secretKey = this.configService.get<string>('KHALTI_SECRET_KEY', 'test_secret_key_...'); // Use sandbox key by default
        this.gatewayUrl = this.configService.get<string>(
            'KHALTI_GATEWAY_URL',
            'https://a.khalti.com/api/v2/epayment/initiate/',
        ); // v2 ePayment API
        this.websiteUrl = this.configService.get<string>('WEBSITE_URL', 'http://localhost:3000');
        this.returnUrl = this.configService.get<string>('KHALTI_RETURN_URL', 'http://localhost:3000/payment/khalti/callback');
    }

    async initiatePayment(amount: number, transactionId: string, productName: string, customerInfo: { name: string, email: string, phone: string }) {
        try {
            // Amount in Paisa (Rupees * 100)
            const amountInPaisa = amount * 100;

            const payload = {
                return_url: this.returnUrl,
                website_url: this.websiteUrl,
                amount: amountInPaisa,
                purchase_order_id: transactionId,
                purchase_order_name: productName,
                customer_info: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone
                }
            };

            const headers = {
                Authorization: `Key ${this.secretKey}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.post(this.gatewayUrl, payload, { headers });

            return {
                payment_url: response.data.payment_url,
                pidx: response.data.pidx,
            };
        } catch (error) {
            this.logger.error('Error initiating Khalti payment', error?.response?.data || error.message);
            throw new BadRequestException(error?.response?.data?.detail || 'Failed to initiate Khalti payment');
        }
    }

    async verifyPayment(pidx: string) {
        try {
            const verifyUrl = 'https://a.khalti.com/api/v2/epayment/lookup/';
            const headers = {
                Authorization: `Key ${this.secretKey}`,
                'Content-Type': 'application/json',
            };

            const response = await axios.post(verifyUrl, { pidx }, { headers });

            if (response.data.status !== 'Completed') {
                throw new BadRequestException(`Payment status: ${response.data.status}`);
            }

            return {
                status: 'SUCCESS',
                pidx: response.data.pidx,
                transactionId: response.data.transaction_id,
                amount: response.data.total_amount / 100, // Convert back to Rupees
            };

        } catch (error) {
            this.logger.error('Error verifying Khalti payment', error?.response?.data || error.message);
            throw new BadRequestException('Khalti verification failed');
        }
    }
}
