# Payment Testing Guide

## Overview

Mero Jugx supports two payment gateways: **Stripe** (USD) and **eSewa** (NPR). This guide covers testing both payment systems.

## Stripe Testing

### Setup

1. Create a Stripe account: https://stripe.com
2. Get test API keys from: https://dashboard.stripe.com/test/apikeys
3. Add to `.env`:
   ```env
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   STRIPE_TEST_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   ```

### Test Cards

Use these test card numbers:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Visa - Success |
| `4000 0000 0000 0002` | Visa - Card declined |
| `4000 0000 0000 9995` | Visa - Insufficient funds |
| `5555 5555 5555 4444` | Mastercard - Success |

**Expiry**: Any future date (e.g., 12/25)  
**CVC**: Any 3 digits (e.g., 123)  
**ZIP**: Any 5 digits (e.g., 12345)

### Testing Flow

1. Navigate to Packages page
2. Select a package
3. Choose subscription period
4. Select **Stripe** as payment method
5. Click "Continue to Payment"
6. Enter test card details
7. Complete payment

### Expected Behavior

- Payment redirects to Stripe Checkout
- After payment, redirects back to application
- Package is upgraded automatically
- Payment record created in database

## eSewa Testing

### Setup

1. Register at: https://developer.esewa.com.np
2. Use test credentials:
   ```env
   ESEWA_TEST_MERCHANT_ID=EPAYTEST
   ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
   ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
   ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status
   ```

### Mock Mode (Development)

For local development without actual eSewa redirect:

```env
ESEWA_USE_MOCK_MODE=true
```

When enabled, payment is automatically approved without redirecting to eSewa.

### Testing Flow

1. Navigate to Packages page
2. Select a package
3. Choose subscription period
4. Select **eSewa** as payment method
5. Click "Continue to Payment"
6. Redirects to eSewa RC (Release Candidate) environment
7. Use test credentials or mock mode
8. Complete payment
9. Redirects back to application

### Test Credentials

- **Merchant ID**: `EPAYTEST`
- **Secret Key**: `8gBm/:&EnhH.1/q`
- **Environment**: RC (Release Candidate)

### Expected Behavior

- Payment redirects to eSewa RC
- After payment, redirects back with verification
- Payment is verified server-side
- Package is upgraded automatically

## Payment Verification

### Automatic Verification

Both gateways verify payments automatically:
- **Stripe**: Webhook or redirect verification
- **eSewa**: Server-side verification after redirect

### Manual Verification

Check payment status:
```bash
# API endpoint
GET /api/v1/payments/:id
```

## Testing Scenarios

### Successful Payment

1. Use valid test card (Stripe) or complete eSewa flow
2. Verify package upgrade
3. Check payment record status: `COMPLETED`
4. Verify organization package updated

### Failed Payment

1. Use declined card (Stripe) or cancel eSewa
2. Payment record status: `FAILED`
3. Package remains unchanged
4. User sees error message

### Pending Payment

1. Payment initiated but not completed
2. Payment record status: `PENDING`
3. Can be verified later
4. Timeout after 24 hours

## Package Upgrade Testing

### Mid-Subscription Upgrade

1. Organization has active package
2. User selects higher-tier package
3. System calculates prorated credit
4. Final price = New package price - Prorated credit
5. Payment for difference only

### Subscription Periods

Test different periods:
- **3 months**: No discount
- **6 months**: 4% discount
- **1 year**: 7.5% discount
- **Custom (>12 months)**: 10% discount

## Feature Purchase Testing

1. Navigate to Available Features
2. Select a feature (e.g., "500 Users")
3. Choose payment gateway
4. Complete payment
5. Feature activated immediately
6. Check organization features updated

## Auto-Renewal Testing

1. Enable auto-renewal for package
2. Provide payment credentials
3. Wait for package expiration
4. System automatically renews
5. Payment processed automatically

## Troubleshooting

### Stripe Issues

- **Invalid API key**: Check test vs production keys
- **Card declined**: Use correct test card numbers
- **Webhook not received**: Check webhook URL configuration

### eSewa Issues

- **Redirect fails**: Check API URL configuration
- **Verification fails**: Check secret key
- **Mock mode not working**: Verify `ESEWA_USE_MOCK_MODE=true`

### Payment Not Processing

- Check payment gateway logs
- Verify database payment records
- Check organization package status
- Review error logs

## Production Checklist

Before going live:
- [ ] Switch to production API keys
- [ ] Test with real payment (small amount)
- [ ] Verify webhook endpoints
- [ ] Test refund process
- [ ] Configure payment notifications
- [ ] Set up monitoring
- [ ] Test error handling

