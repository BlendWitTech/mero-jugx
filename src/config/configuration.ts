export default () => ({
  // Application
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'mero_jugx',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@mero-jugx.com',
    fromName: process.env.SMTP_FROM_NAME || 'Mero Jugx',
    resendApiKey: process.env.RESEND_API_KEY || '',
  },

  // 2FA/MFA
  totp: {
    issuer: process.env.TOTP_ISSUER || 'Mero Jugx',
    algorithm: process.env.TOTP_ALGORITHM || 'SHA1',
    digits: parseInt(process.env.TOTP_DIGITS, 10) || 6,
    period: parseInt(process.env.TOTP_PERIOD, 10) || 30,
  },

  // Application URLs
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    dest: process.env.UPLOAD_DEST || './uploads',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',

  // eSewa Payment Gateway
  esewa: {
    // Test credentials (for development)
    // eSewa RC (Release Candidate) environment for testing
    // URL: https://rc-epay.esewa.com.np
    // Documentation: https://developer.esewa.com.np/pages/Epay
    // Test credentials: https://developer.esewa.com.np/pages/Test-credentials
    testMerchantId: process.env.ESEWA_TEST_MERCHANT_ID || 'EPAYTEST',
    // Default UAT secret key from eSewa documentation (Epay-v2)
    // Source: https://developer.esewa.com.np/pages/Test-credentials
    testSecretKey: process.env.ESEWA_TEST_SECRET_KEY || '8gBm/:&EnhH.1/q',
    // RC environment URLs for testing (v2 API format)
    testApiUrl: process.env.ESEWA_TEST_API_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    testVerifyUrl: process.env.ESEWA_TEST_VERIFY_URL || 'https://rc.esewa.com.np/api/epay/transaction/status',
    
    // Production credentials
    merchantId: process.env.ESEWA_MERCHANT_ID || '',
    secretKey: process.env.ESEWA_SECRET_KEY || '',
    // Production URLs (v2 API format)
    apiUrl: process.env.ESEWA_API_URL || 'https://epay.esewa.com.np/api/epay/main/v2/form',
    verifyUrl: process.env.ESEWA_VERIFY_URL || 'https://esewa.com.np/api/epay/transaction/status',
    
    // Mock mode for development (bypasses actual eSewa redirect)
    useMockMode: process.env.ESEWA_USE_MOCK_MODE === 'true' || false,
  },

  // Stripe Payment Gateway
  stripe: {
    // Test credentials (for development)
    // Use Stripe test mode keys from https://dashboard.stripe.com/test/apikeys
    testPublishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || '',
    testSecretKey: process.env.STRIPE_TEST_SECRET_KEY || '',
    
    // Production credentials
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    
    // Webhook secret for verifying webhook signatures
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Currency Configuration
  currency: {
    // Exchange rate: 1 NPR = X USD (update as needed)
    nprToUsdRate: parseFloat(process.env.NPR_TO_USD_RATE || '0.0075'),
    // Default currency for non-Nepal regions
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
    // Nepal country code
    nepalCountryCode: process.env.NEPAL_COUNTRY_CODE || 'NP',
  },
});

