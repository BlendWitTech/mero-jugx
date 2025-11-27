# Mero Jugx

A comprehensive organization-based authentication and user management system with multi-tenant support, role-based access control, package management, real-time chat, and payment integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:init

# Start development servers
npm run start:dev  # Backend (port 3000)
cd frontend && npm run dev  # Frontend (port 3001)
```

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) folder:

- **[System Architecture](./docs/system-architecture.md)** - System design, modules, and architecture patterns
- **[Database Design](./docs/database-design.md)** - Database schema, relationships, and ERD
- **[Use Cases](./docs/use-cases.md)** - User flows and use case diagrams
- **[API Documentation](./docs/api-documentation.md)** - Complete REST API reference
- **[Environment Setup](./docs/environment-setup.md)** - Configuration and environment variables
- **[Payment Testing](./docs/payment-testing.md)** - Payment gateway setup and testing
- **[Email Setup](./docs/email-setup.md)** - Email service configuration
- **[Tech Stack](./docs/tech-stack.md)** - Technologies and frameworks used
- **[Developer Guide](./docs/developer-guide.md)** - Comprehensive development guide

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript, PostgreSQL, TypeORM, Redis, Socket.IO
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand, React Query
- **Authentication**: JWT, Passport.js, MFA (TOTP)
- **Payments**: Stripe, eSewa
- **Real-time**: WebSocket (Socket.IO), WebRTC

## 📁 Project Structure

```
mero-jugx/
├── src/                    # Backend source code
│   ├── auth/              # Authentication module
│   ├── organizations/     # Organization management
│   ├── users/             # User management
│   ├── roles/             # Role and permission management
│   ├── packages/          # Package and subscription management
│   ├── payments/          # Payment processing
│   ├── chat/              # Real-time chat and calls
│   ├── notifications/     # Notification system
│   └── database/          # Database entities, migrations, seeds
├── frontend/              # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # State management
├── docs/                  # Documentation
├── api/                   # Postman collections
└── test/                  # E2E tests
```

## 🔑 Key Features

- **Multi-Organization Support** - Users can belong to multiple organizations
- **Role-Based Access Control** - Granular permissions system
- **Package Management** - Subscription-based feature access
- **Real-Time Chat** - WebSocket-based messaging with audio/video calls
- **Payment Integration** - Stripe and eSewa payment gateways
- **Multi-Factor Authentication** - TOTP-based 2FA
- **Audit Logging** - Comprehensive activity tracking
- **Document Management** - Organization document storage

## 📖 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api/docs` (when server is running)

Postman collections are available in the [`api/`](./api/) folder for easy API testing.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

## 📝 License

UNLICENSED - Proprietary software

## 👥 Author

Blendwit Tech

---

For detailed information, please refer to the [documentation](./docs/) folder.

