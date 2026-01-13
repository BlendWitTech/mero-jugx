# Payment Integration

This guide details the payment gateway configurations for **eSewa** and **Stripe** within the Mero Jugx platform.

## 💳 Supported Gateways

1. **eSewa** (Nepal) - For NPR transactions.
2. **Stripe** (International) - For USD and global transactions.

---

## 🇳🇵 eSewa Integration

**Status**: ✅ Fully Configured (Test Mode active)

### Configuration
The system is pre-configured with eSewa's public test credentials.

```env
# .env Configuration
ESEWA_TEST_MERCHANT_ID=EPAYTEST
ESEWA_TEST_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_TEST_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_USE_MOCK_MODE=false
```

### Testing Flow
1. Select **eSewa** when purchasing an app.
2. You will be redirected to the eSewa Release Candidate (RC) environment.
3. Use the credentials provided in the eSewa developer docs (or default test accounts) to complete the payment.

**Troubleshooting**:
If you encounter "Token Authentication" errors, enable Mock Mode in `.env`:
```env
ESEWA_USE_MOCK_MODE=true
```

---

## 🌏 Stripe Integration

**Status**: ⚠️ Ready (Requires API Keys)

### Setup Instructions

1. **Get Test Keys**:
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com/).
   - Toggle **Test Mode** on.
   - Copy `Publishable Key` and `Secret Key`.

2. **Update .env**:
   ```env
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
   STRIPE_TEST_SECRET_KEY=sk_test_...
   ```

3. **Restart Backend**:
   - The server initiates Stripe on boot. Look for: `💳 Stripe initialized (Test mode)`.

### Testing Flow
1. Select **Stripe** when purchasing an app.
2. Use [Stripe Test Cards](https://stripe.com/docs/testing):
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`

---

## 💻 Code Reference

| Component | Path |
|-----------|------|
| **Service** | `src/payments/payments.service.ts` |
| **eSewa Logic** | `src/payments/esewa.service.ts` |
| **Stripe Logic** | `src/payments/stripe.service.ts` |
| **Frontend UI** | `frontend/src/pages/apps/AppsPage.tsx` |
