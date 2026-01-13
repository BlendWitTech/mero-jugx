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
      success_url: params.successUrl || this.successUrl, // Success URL
      failure_url: params.failureUrl || this.failureUrl, // Failure URL
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
      let verificationUrl = this.isDevelopment
        ? esewaConfig?.testVerifyUrl || 'https://rc.esewa.com.np/api/epay/transaction/status'
        : esewaConfig?.verifyUrl || 'https://esewa.com.np/api/epay/transaction/status';

      // Ensure URL has trailing slash if needed
      if (!verificationUrl.endsWith('/')) {
        verificationUrl += '/';
      }

      this.logger.debug(`🔗 eSewa Verification URL: ${verificationUrl}`);
      this.logger.debug(`Transaction ID: ${transactionId}, Ref ID: ${refId || 'N/A'}, Amount: ${totalAmount || 'N/A'}`);

      // v2 API uses: product_code, total_amount, transaction_uuid
      // Build query parameters
      const params: Record<string, string> = {
        product_code: this.merchantId,
        transaction_uuid: transactionId,
      };

      // Add total_amount if provided (required for v2 API)
      if (totalAmount && totalAmount > 0) {
        params.total_amount = totalAmount.toFixed(2);
      }

      // If ref_id is provided, add it to the request
      if (refId && refId.trim() !== '') {
        params.ref_id = refId;
      }

      this.logger.debug(`Verifying payment with params: ${JSON.stringify(params)}`);

      // Make verification request to eSewa
      // Try GET first (standard for eSewa v2 API)
      let response;
      try {
        response = await axios.get(verificationUrl, {
          params,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        });
      } catch (getError: any) {
        // If GET fails, try POST (some eSewa implementations use POST)
        this.logger.warn(`GET request failed, trying POST: ${getError.message}`);
        try {
          response = await axios.post(verificationUrl, params, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 30000,
          });
        } catch (postError: any) {
          // Both GET and POST failed
          this.logger.error(`Both GET and POST verification requests failed`);
          this.logger.error(`GET error: ${getError.message}`);
          this.logger.error(`POST error: ${postError.message}`);

          // Check for network errors
          if (getError.code === 'ECONNREFUSED' || getError.code === 'ETIMEDOUT' || postError.code === 'ECONNREFUSED' || postError.code === 'ETIMEDOUT') {
            return {
              status: 'failure',
              message: 'Unable to connect to eSewa verification service. Please try again later.',
            };
          }

          // Check for specific eSewa error responses
          const errorResponse = getError.response || postError.response;
          if (errorResponse?.data) {
            const errorData = errorResponse.data;
            if (errorData.error_message || errorData.message) {
              return {
                status: 'failure',
                message: errorData.error_message || errorData.message || 'Payment verification failed',
              };
            }
          }

          throw getError; // Throw the original GET error
        }
      }

      // Parse eSewa response (v2 API returns JSON)
      const responseData = response.data;
      this.logger.debug(`eSewa verification response: ${JSON.stringify(responseData)}`);

      // Handle different response formats
      // v2 API response format: { product_code, transaction_uuid, total_amount, status, ref_id }
      // Some responses might be wrapped in a data field
      const actualData = responseData.data || responseData;
      const status = actualData.status || actualData.payment_status || actualData.Status;

      if (status === 'COMPLETE' || status === 'SUCCESS' || status === 'success' || status === 'COMPLETED') {
        return {
          status: 'success',
          refId: actualData.ref_id || actualData.reference_id || actualData.transaction_code || refId,
        };
      } else if (status === 'PENDING' || status === 'pending') {
        return {
          status: 'failure',
          message: 'Payment is still pending. Please wait a moment and try again.',
        };
      } else if (status === 'NOT_FOUND' || status === 'NOTFOUND' || status === 'not_found') {
        return {
          status: 'failure',
          message: 'Payment transaction not found. Please verify the transaction ID.',
        };
      } else if (status === 'CANCELED' || status === 'CANCELLED' || status === 'canceled') {
        return {
          status: 'failure',
          message: 'Payment was canceled.',
        };
      } else if (status === 'FAILED' || status === 'FAILURE' || status === 'failed') {
        return {
          status: 'failure',
          message: actualData.message || actualData.error_message || 'Payment verification failed',
        };
      } else {
        // Unknown status
        this.logger.warn(`Unknown eSewa status: ${status}`);
        return {
          status: 'failure',
          message: actualData.message || actualData.error_message || `Payment status: ${status || 'unknown'}`,
        };
      }
    } catch (error: any) {
      this.logger.error(`eSewa verification error: ${error.message}`, error.stack);
      this.logger.error(`Error details: ${JSON.stringify({
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      })}`);

      // Handle specific error cases
      if (error.response?.data) {
        const errorData = error.response.data;

        // Check for error_message field
        if (errorData.error_message) {
          return {
            status: 'failure',
            message: errorData.error_message,
          };
        }

        // Check for message field
        if (errorData.message) {
          return {
            status: 'failure',
            message: errorData.message,
          };
        }

        // Check for error field
        if (errorData.error) {
          return {
            status: 'failure',
            message: typeof errorData.error === 'string' ? errorData.error : 'Payment verification failed',
          };
        }
      }

      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return {
          status: 'failure',
          message: 'Unable to connect to eSewa service. Please check your internet connection and try again.',
        };
      }

      // Handle HTTP errors
      if (error.response?.status) {
        const status = error.response.status;
        if (status === 400) {
          return {
            status: 'failure',
            message: 'Invalid payment parameters. Please contact support.',
          };
        } else if (status === 401 || status === 403) {
          return {
            status: 'failure',
            message: 'Authentication failed. Please check your eSewa credentials.',
          };
        } else if (status === 404) {
          return {
            status: 'failure',
            message: 'Payment transaction not found.',
          };
        } else if (status >= 500) {
          return {
            status: 'failure',
            message: 'eSewa service is temporarily unavailable. Please try again later.',
          };
        }
      }

      // Generic error
      return {
        status: 'failure',
        message: error.message || 'Payment verification failed. Please try again.',
      };
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
