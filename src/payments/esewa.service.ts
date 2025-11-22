import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

export interface EsewaPaymentInitParams {
  amount: number; // Base amount (excluding tax)
  taxAmount: number;
  totalAmount: number; // Total amount including tax
  transactionId: string; // Transaction UUID
  productServiceCharge: number;
  productDeliveryCharge: number;
  productCode: string; // Product code (merchant ID)
  successUrl: string;
  failureUrl: string;
}

export interface EsewaVerificationResponse {
  status: 'success' | 'failure';
  refId?: string;
  message?: string;
}

@Injectable()
export class EsewaService {
  private readonly logger = new Logger(EsewaService.name);
  private readonly isDevelopment: boolean;
  private readonly useMockMode: boolean;
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;
  public readonly successUrl: string;
  public readonly failureUrl: string;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const esewaConfig = this.configService.get('esewa');

    // Check if mock mode is enabled
    this.useMockMode = esewaConfig?.useMockMode || false;

    // Use test credentials for development, production credentials for production
    this.merchantId = this.isDevelopment
      ? esewaConfig?.testMerchantId || 'EPAYTEST'
      : esewaConfig?.merchantId || '';

    // Get secret key and trim any whitespace
    const rawSecretKey = this.isDevelopment
      ? esewaConfig?.testSecretKey || '8gBm/:&EnhH.1/q'
      : esewaConfig?.secretKey || '';

    this.secretKey = rawSecretKey.trim();

    if (!this.secretKey) {
      this.logger.warn('⚠️  eSewa secret key is not configured. Payment signatures will fail.');
    } else {
      this.logger.debug(
        `🔑 eSewa Secret Key configured (length: ${this.secretKey.length}, starts with: ${this.secretKey.substring(0, 5)})`,
      );
    }

    // eSewa API URLs
    // In mock mode, we'll use a local mock endpoint
    if (this.useMockMode && this.isDevelopment) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      this.apiUrl = `${frontendUrl}/payment/mock-esewa`;
      this.logger.warn('⚠️  eSewa Mock Mode enabled - payments will be simulated locally');
    } else {
      // Use RC environment for development (rc-epay.esewa.com.np)
      // Production uses epay.esewa.com.np
      // v2 API format: /api/epay/main/v2/form
      this.apiUrl = this.isDevelopment
        ? esewaConfig?.testApiUrl || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
        : esewaConfig?.apiUrl || 'https://epay.esewa.com.np/api/epay/main/v2/form';

      // Log the URL being used for debugging
      this.logger.log(`🔗 eSewa API URL: ${this.apiUrl}`);
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    this.successUrl = `${frontendUrl}/payment/success`;
    this.failureUrl = `${frontendUrl}/payment/failure`;
  }

  /**
   * Generate HMAC SHA256 signature for eSewa v2 API
   * Based on eSewa documentation: https://developer.esewa.com.np/pages/Epay
   * Signature must include: total_amount,transaction_uuid,product_code in that order
   */
  private generateSignature(
    totalAmount: string,
    transactionUuid: string,
    productCode: string,
  ): string {
    // Create message string exactly as per eSewa v2 API documentation
    // Format: total_amount=value,transaction_uuid=value,product_code=value
    // Values must match exactly what's sent in the form
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

    // Generate HMAC SHA256 signature
    // Secret key should be used as-is (no encoding needed for HMAC)
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(message, 'utf8'); // Explicitly specify UTF-8 encoding
    const signature = hmac.digest('base64');

    this.logger.debug(`eSewa Signature Message: ${message}`);
    this.logger.debug(`eSewa Secret Key (first 5 chars): ${this.secretKey.substring(0, 5)}...`);
    this.logger.debug(`eSewa Signature: ${signature}`);

    return signature;
  }

  /**
   * Generate payment form data for eSewa v2 API
   * Based on eSewa documentation: https://developer.esewa.com.np/pages/Epay
   * Uses v2 API format with signature generation
   */
  generatePaymentForm(params: EsewaPaymentInitParams): {
    formUrl: string;
    formData: Record<string, string>;
  } {
    const {
      amount,
      taxAmount,
      totalAmount,
      transactionId,
      productServiceCharge,
      productDeliveryCharge,
      productCode,
    } = params;

    // Round all amounts to 2 decimal places to avoid floating point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;
    const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
    const roundedServiceCharge = Math.round(productServiceCharge * 100) / 100;
    const roundedDeliveryCharge = Math.round(productDeliveryCharge * 100) / 100;
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100;

    // Calculate total with charges
    const calculatedTotal =
      roundedAmount + roundedTaxAmount + roundedServiceCharge + roundedDeliveryCharge;

    // Allow small floating point differences (0.01 NPR)
    if (Math.abs(calculatedTotal - roundedTotalAmount) > 0.01) {
      this.logger.error(
        `Amount mismatch: calculated=${calculatedTotal}, provided=${roundedTotalAmount}, amount=${roundedAmount}, tax=${roundedTaxAmount}`,
      );
      throw new BadRequestException(
        `Total amount mismatch: calculated ${calculatedTotal.toFixed(2)} but provided ${roundedTotalAmount.toFixed(2)}`,
      );
    }

    // Prepare form data as per eSewa v2 API documentation
    // Field names must match v2 API format exactly
    const formData: Record<string, string> = {
      amount: roundedAmount.toFixed(2), // Base amount (excluding tax)
      tax_amount: roundedTaxAmount.toFixed(2), // Tax amount
      total_amount: roundedTotalAmount.toFixed(2), // Total amount including tax
      transaction_uuid: transactionId, // Transaction UUID
      product_code: productCode && productCode.trim() !== '' ? productCode : this.merchantId, // Product code (merchant ID)
      product_service_charge: roundedServiceCharge.toFixed(2), // Product service charge
      product_delivery_charge: roundedDeliveryCharge.toFixed(2), // Product delivery charge
      success_url: this.successUrl, // Success URL
      failure_url: this.failureUrl, // Failure URL
      signed_field_names: 'total_amount,transaction_uuid,product_code', // Fields to sign (in order)
    };

    // Generate signature using HMAC SHA256
    // IMPORTANT: Use the exact same values that will be sent in the form
    // Values must match character-for-character
    const signature = this.generateSignature(
      formData.total_amount, // Must match exactly
      formData.transaction_uuid, // Must match exactly
      formData.product_code, // Must match exactly (should be EPAYTEST)
    );
    formData.signature = signature;

    // Log for debugging - verify values match
    this.logger.debug(
      `Signature generated with values: total_amount=${formData.total_amount}, transaction_uuid=${formData.transaction_uuid}, product_code=${formData.product_code}`,
    );

    this.logger.debug(`eSewa Payment Form Data: ${JSON.stringify(formData)}`);
    this.logger.debug(`eSewa Payment Form URL: ${this.apiUrl}`);

    return {
      formUrl: this.apiUrl,
      formData,
    };
  }

  /**
   * Verify payment with eSewa v2 API
   * Based on eSewa documentation: https://developer.esewa.com.np/pages/Epay
   * Uses status check API: /api/epay/transaction/status/
   */
  async verifyPayment(
    transactionId: string,
    refId: string,
    totalAmount?: number,
  ): Promise<EsewaVerificationResponse> {
    try {
      // eSewa verification endpoint (v2 API - status check)
      const esewaConfig = this.configService.get('esewa');
      const verificationUrl = this.isDevelopment
        ? esewaConfig?.testVerifyUrl || 'https://rc.esewa.com.np/api/epay/transaction/status'
        : esewaConfig?.verifyUrl || 'https://esewa.com.np/api/epay/transaction/status';

      this.logger.debug(`🔗 eSewa Verification URL: ${verificationUrl}`);

      // v2 API uses: product_code, total_amount, transaction_uuid
      const verificationData = {
        product_code: this.merchantId,
        transaction_uuid: transactionId,
        total_amount: totalAmount || 0, // Should be provided from payment record
      };

      // If ref_id is provided, add it to the request
      if (refId) {
        verificationData['ref_id'] = refId;
      }

      this.logger.debug(`Verifying payment: ${JSON.stringify(verificationData)}`);

      // Make verification request to eSewa (GET request with query parameters)
      const response = await axios.get(verificationUrl, {
        params: verificationData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Parse eSewa response (v2 API returns JSON)
      const responseData = response.data;
      this.logger.debug(`eSewa verification response: ${JSON.stringify(responseData)}`);

      // v2 API response format: { product_code, transaction_uuid, total_amount, status, ref_id }
      if (responseData.status === 'COMPLETE') {
        return {
          status: 'success',
          refId: responseData.ref_id || refId,
        };
      } else if (responseData.status === 'PENDING') {
        return {
          status: 'failure',
          message: 'Payment is still pending',
        };
      } else if (responseData.status === 'NOT_FOUND' || responseData.status === 'CANCELED') {
        return {
          status: 'failure',
          message: `Payment ${responseData.status.toLowerCase()}`,
        };
      } else {
        return {
          status: 'failure',
          message: responseData.status || 'Payment verification failed',
        };
      }
    } catch (error: any) {
      this.logger.error(`eSewa verification error: ${error.message}`, error.stack);

      // Handle specific error cases
      if (error.response?.data?.error_message) {
        return {
          status: 'failure',
          message: error.response.data.error_message,
        };
      }

      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Calculate tax amount (13% VAT in Nepal)
   * Amount is assumed to be the base amount (excluding tax)
   * Tax = amount * 0.13
   */
  calculateTax(amount: number): number {
    // Nepal VAT is 13% on base amount
    // Round to 2 decimal places to avoid floating point issues
    const tax = amount * 0.13;
    return Math.round(tax * 100) / 100;
  }

  /**
   * Calculate total amount including tax
   * Total = base amount + tax
   */
  calculateTotalWithTax(amount: number): number {
    // Total = base amount + tax
    // Round to 2 decimal places to avoid floating point issues
    const tax = this.calculateTax(amount);
    const total = amount + tax;
    return Math.round(total * 100) / 100;
  }
}
