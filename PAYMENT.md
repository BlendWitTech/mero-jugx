# Payment API Integration 💳

Technical guide for integrating Nepali payment gateways.

## 1. eSewa (EPAY v2)

Docs: [developer.esewa.com.np](https://developer.esewa.com.np)

### Configuration
```env
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_SECRET=8gBm/:&EnhH.1/q
ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
```

### Signature Generation (Node.js)
```typescript
import { createHmac } from 'crypto';

function generateSignature(totalAmount: string, txnUuid: string, productCode: string) {
    const message = `total_amount=${totalAmount},transaction_uuid=${txnUuid},product_code=${productCode}`;
    const hash = createHmac('sha256', process.env.ESEWA_SECRET);
    hash.update(message);
    return hash.digest('base64');
}
```

### Verification Payload
GET request to eSewa to confirm status.
```
GET /api/epay/transaction/status/?product_code=EPAYTEST&total_amount=100&transaction_uuid=TXN-123
```

## 2. Khalti (Checkout)

Docs: [docs.khalti.com](https://docs.khalti.com)

### Configuration
```env
KHALTI_PUBLIC_KEY=test_public_key_...
KHALTI_SECRET_KEY=test_secret_key_...
```

### Verification (Backend)
```typescript
async function verifyKhalti(pidx: string) {
    const headers = { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` };
    const body = { pidx };
    
    return axios.post('https://a.khalti.com/api/v2/epayment/lookup/', body, { headers });
}
```

## 3. ConnectIPS (Planned)
Enterprise bank transfers. Requires `.pfx` certificate handling.

---

**Note**: Always use Sandbox credentials (`EPAYTEST`) during development. Never commit production keys.
