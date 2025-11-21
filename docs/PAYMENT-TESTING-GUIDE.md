# Payment Testing Guide

Complete guide for testing payment gateways (eSewa and Stripe) in the Mero Jugx application.

## Table of Contents

1. [Overview](#overview)
2. [eSewa Testing](#esewa-testing)
3. [Stripe Testing](#stripe-testing)
4. [Payment Verification](#payment-verification)
5. [Troubleshooting](#troubleshooting)
6. [Test Credentials](#test-credentials)

---

## Overview

The application supports two payment gateways:

1. **eSewa** - For payments in NPR (Nepalese Rupees)
2. **Stripe** - For payments in USD (US Dollars)

Users can select their preferred payment gateway on the packages page before making a payment.

---

## eSewa Testing

### Test Credentials

**Merchant Credentials:**
- **Merchant ID**: `EPAYTEST`
- **Secret Key**: `8gBm/:&EnhH.1/q`
- **API URL**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Verify URL**: `https://rc.esewa.com.np/api/epay/transaction/status`

**Test User Accounts:**
- **User IDs**: `9806800001`, `9806800002`, `9806800003`, `9806800004`, `9806800005`
- **Password**: `Nepal@123`
- **MPIN**: `1122` (for mobile app)

**Documentation:**
- [eSewa Developer Portal](https://developer.esewa.com.np/pages/Epay)
- [Test Credentials](https://developer.esewa.com.np/pages/Test-credentials)

### Environment Configuration

Add to your `.env` file:

```env
# eSewa Test Configuration
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_TEST_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status

# Mock Mode (recommended for development)
ESEWA_USE_MOCK_MODE=true
```

### Testing Methods

#### Method 1: Mock Mode (Recommended)

**Advantages:**
- No external API calls needed
- Faster testing
- No dependency on eSewa RC environment
- Works offline

**Setup:**
1. Set `ESEWA_USE_MOCK_MODE=true` in `.env`
2. Restart backend server
3. Payments will use local mock page

**Testing Steps:**
1. Navigate to `/packages` page
2. Select **eSewa** as payment gateway
3. Click "Upgrade" or "Purchase" button
4. You'll be redirected to `/payment/mock-esewa`
5. Mock page will simulate payment processing
6. After a few seconds, you'll be redirected to success/failure page
7. Payment will be verified automatically

#### Method 2: Real eSewa RC Environment

**Advantages:**
- Tests actual eSewa integration
- Validates API communication
- Tests real payment flow

**Setup:**
1. Set `ESEWA_USE_MOCK_MODE=false` in `.env`
2. Ensure test credentials are correct
3. Restart backend server

**Testing Steps:**
1. Navigate to `/packages` page
2. Select **eSewa** as payment gateway
3. Click "Upgrade" or "Purchase" button
4. You'll be redirected to eSewa RC payment page
5. Login with test credentials:
   - User ID: `9806800001`
   - Password: `Nepal@123`
6. Complete payment on eSewa
7. You'll be redirected back to success/failure page
8. Payment will be verified automatically

**Note:** If you encounter 405 errors or token authentication errors (`set_token_message`), the RC environment may require:
- Valid merchant setup
- Token-based authentication
- Additional configuration

**Solution:** Use Mock Mode instead for development testing.

### Testing Payment Flow

1. **Initiate Payment**
   - Select package or feature
   - Choose eSewa gateway
   - Click purchase/upgrade

2. **Payment Processing**
   - Mock Mode: Local simulation
   - Real Mode: eSewa RC environment

3. **Payment Verification**
   - System automatically verifies payment
   - Updates payment status
   - Activates package/features

4. **Verify Results**
   - Check payment status in database
   - Verify package upgrade
   - Verify feature activation

### Common Issues

**Issue: Token Authentication Required (`set_token_message`)**
- **Error**: `"Please, enter the token that was sent to: 9806800001"`
- **Cause**: eSewa RC environment requires token-based authentication
- **Solution**: Enable Mock Mode (`ESEWA_USE_MOCK_MODE=true`) for development testing
- **Alternative**: Contact eSewa support for RC environment access with token authentication setup

**Issue: 405 Method Not Allowed**
- **Cause**: RC environment not accessible or invalid credentials
- **Solution**: Use Mock Mode (`ESEWA_USE_MOCK_MODE=true`)

**Issue: Invalid Payload Signature (ES104)**
- **Cause**: Incorrect secret key or signature generation
- **Solution**: Verify `ESEWA_TEST_SECRET_KEY` is correct: `8gBm/:&EnhH.1/q`

**Issue: Payment Not Verified**
- **Cause**: Verification API call failed
- **Solution**: Check network connectivity and API URLs

---

## Stripe Testing

### Test Credentials

**Test Card:**
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

**Other Test Cards:**
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

**Get Test Keys:**
- Visit: https://dashboard.stripe.com/test/apikeys
- Copy test keys to `.env`

### Environment Configuration

Add to your `.env` file:

```env
# Stripe Test Configuration
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key_here
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
```

### Testing Steps

1. **Get Test Keys**
   - Sign up/login to Stripe Dashboard
   - Navigate to Developers → API keys
   - Copy test keys (starts with `sk_test_` and `pk_test_`)

2. **Configure Environment**
   - Add keys to `.env` file
   - Restart backend server

3. **Test Payment Flow**
   - Navigate to `/packages` page
   - Select **Stripe** as payment gateway
   - Click "Upgrade" or "Purchase" button
   - You'll be redirected to Stripe Checkout
   - Enter test card: `4242 4242 4242 4242`
   - Complete payment
   - You'll be redirected back to success page
   - Payment will be verified automatically

### Testing Different Scenarios

**Successful Payment:**
- Use card: `4242 4242 4242 4242`
- Payment should complete successfully
- Package/features should be activated

**Declined Payment:**
- Use card: `4000 0000 0000 0002`
- Payment should be declined
- User should see failure message

**3D Secure:**
- Use card: `4000 0025 0000 3155`
- Additional authentication step required
- Complete authentication to proceed

### Webhook Testing (Optional)

For testing webhooks locally:

1. **Install Stripe CLI**
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe
   
   # Windows/Linux
   # Download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Webhooks**
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/payments/webhook
   ```

4. **Test Webhook**
   - Complete a test payment
   - Webhook will be forwarded to your local server
   - Check server logs for webhook events

---

## Payment Verification

### Automatic Verification

After payment completion, the system automatically:

1. **Receives Callback**
   - eSewa: Redirects to `/payment/success?ref_id=...&transaction_uuid=...`
   - Stripe: Redirects to `/payment/success?session_id=...`

2. **Verifies Payment**
   - Calls gateway verification API
   - Validates payment status
   - Updates payment record

3. **Activates Features**
   - Upgrades package (if applicable)
   - Activates purchased features
   - Updates organization limits

### Manual Verification

You can also verify payments manually via API:

**eSewa:**
```bash
GET /api/v1/payments/verify?transaction_uuid={uuid}&ref_id={ref_id}
```

**Stripe:**
```bash
POST /api/v1/payments/verify
Content-Type: application/json

{
  "session_id": "cs_test_...",
  "transactionId": "uuid"
}
```

### Verification Status

Check payment status:

```bash
GET /api/v1/payments/{payment_id}
Authorization: Bearer {token}
```

Response:
```json
{
  "id": "payment-id",
  "transaction_id": "uuid",
  "status": "completed",
  "amount": 100.00,
  "currency": "NPR",
  "gateway": "esewa",
  "created_at": "2025-11-21T...",
  "completed_at": "2025-11-21T..."
}
```

---

## Troubleshooting

### Payment Not Processing

**Check:**
1. Gateway is selected correctly
2. Environment variables are set
3. Backend server is running
4. Network connectivity

**Solutions:**
- Verify `.env` configuration
- Check backend logs
- Test API endpoints
- Verify gateway credentials

### Payment Not Verified

**Check:**
1. Callback URL is correct
2. Verification API is accessible
3. Payment status in gateway

**Solutions:**
- Check callback URLs in gateway settings
- Verify network connectivity
- Review verification logs
- Check payment status in gateway dashboard

### Amount Mismatch

**Check:**
1. Currency conversion is correct
2. Tax calculation (for eSewa)
3. Amount formatting

**Solutions:**
- Verify exchange rate in `.env`
- Check tax calculation logic
- Ensure amounts are rounded correctly
- Review payment logs

### Gateway Errors

**eSewa:**
- **ES104**: Invalid signature - Check secret key
- **405**: Method not allowed - Use Mock Mode
- **Connection Error**: Check API URLs

**Stripe:**
- **Invalid API Key**: Check test/live keys
- **Card Declined**: Use correct test card
- **Webhook Error**: Verify webhook secret

---

## Test Credentials Summary

### eSewa

| Item | Value |
|------|-------|
| Merchant ID | `EPAYTEST` |
| Secret Key | `8gBm/:&EnhH.1/q` |
| Test User ID | `9806800001` |
| Test Password | `Nepal@123` |
| API URL | `https://rc-epay.esewa.com.np/api/epay/main/v2/form` |

### Stripe

| Item | Value |
|------|-------|
| Test Card | `4242 4242 4242 4242` |
| Test Card (Decline) | `4000 0000 0000 0002` |
| Test Keys | Get from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) |

---

## Best Practices

1. **Use Mock Mode** for development when possible
2. **Test both gateways** before production
3. **Verify payment status** after each test
4. **Check package upgrades** after successful payment
5. **Test failure scenarios** (declined cards, network errors)
6. **Monitor logs** during testing
7. **Use test credentials** only in development
8. **Never commit** real credentials to version control

---

## Additional Resources

- [eSewa Developer Portal](https://developer.esewa.com.np/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [README.md](../README.md) - Project overview
- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) - Developer guide

---

**Last Updated**: 2025-11-21

