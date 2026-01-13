import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { EsewaVerificationDto } from './dto/esewa-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 200, description: 'Payment created successfully' })
  @ApiResponse({ status: 403, description: 'Not a member of organization' })
  async createPayment(
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
    @Body() createPaymentDto: CreatePaymentDto,
    @Headers('origin') origin?: string,
  ) {
    if (!organization || !organization.id) {
      throw new NotFoundException('Organization not found. Please ensure you are a member of an organization.');
    }
    return this.paymentsService.createPayment(user.userId, organization.id, createPaymentDto, origin);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Public() // eSewa will call this endpoint, so it should be public
  @ApiOperation({ summary: 'Verify payment after eSewa callback (POST)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Payment verification failed' })
  async verifyPaymentPost(@Body() verificationDto: EsewaVerificationDto) {
    return this.paymentsService.verifyPayment(verificationDto.transactionId, verificationDto.refId);
  }

  @Get('verify')
  @Public() // Payment gateways will call this endpoint, so it should be public
  @ApiOperation({ summary: 'Verify payment after gateway callback (GET)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Payment verification failed' })
  async verifyPaymentGet(
    @Query('transaction_uuid') transactionUuid: string,
    @Query('ref_id') refId: string,
    @Query('session_id') sessionId: string,
    @Query('data') data?: string, // eSewa v2 API sends base64-encoded JSON
    @Query('pid') pid?: string, // Legacy parameter support
    @Query('refId') refIdLegacy?: string, // Legacy parameter support
  ) {
    // eSewa v2 API returns data in a base64-encoded JSON string
    let esewaData: any = null;
    if (data) {
      try {
        const decodedData = Buffer.from(data, 'base64').toString('utf-8');
        esewaData = JSON.parse(decodedData);
        console.log('Decoded eSewa data from GET request:', esewaData);
      } catch (error) {
        console.error('Failed to decode eSewa data parameter:', error);
      }
    }

    // Extract transaction info from decoded data if available
    let transactionId = transactionUuid || pid;
    let finalRefId = refId || refIdLegacy;

    if (esewaData) {
      // Priority: decoded data > query params
      transactionId =
        esewaData.transaction_uuid || esewaData.transaction_code || esewaData.oid || transactionId;
      // eSewa v2 API may return transaction_code instead of ref_id
      finalRefId =
        esewaData.ref_id ||
        esewaData.reference_id ||
        esewaData.transaction_code || // Use transaction_code as ref_id if ref_id is not present
        finalRefId;
    }

    if (!transactionId && !sessionId) {
      return {
        success: false,
        message: 'Missing transaction ID or session ID',
      };
    }

    // For Stripe, use session_id; for eSewa, use ref_id
    return this.paymentsService.verifyPayment(transactionId || '', finalRefId, sessionId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments for organization' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(@CurrentUser() user: any, @CurrentOrganization() organization: any) {
    if (!organization || !organization.id) {
      throw new NotFoundException('Organization not found. Please ensure you are a member of an organization.');
    }
    return this.paymentsService.getPayments(organization.id, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Param('id') paymentId: string,
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ) {
    if (!organization || !organization.id) {
      throw new NotFoundException('Organization not found. Please ensure you are a member of an organization.');
    }
    return this.paymentsService.getPayment(paymentId, user.userId, organization.id);
  }
}
