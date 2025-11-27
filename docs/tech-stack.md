# Technology Stack

## Overview

Mero Jugx is built with modern, production-ready technologies for both backend and frontend.

## Backend Stack

### Core Framework

- **NestJS 10.3.0**
  - Modular architecture
  - Dependency injection
  - Built-in TypeScript support
  - Decorator-based routing

### Language

- **TypeScript 5.3.3**
  - Type safety
  - Modern ES features
  - Better IDE support

### Database

- **PostgreSQL 14+**
  - ACID compliance
  - JSON support
  - Advanced features
  - Excellent performance

- **TypeORM 0.3.17**
  - Object-relational mapping
  - Migration system
  - Query builder
  - Entity relationships

### Caching & Sessions

- **Redis 6+**
  - In-memory storage
  - Session management
  - Token blacklisting
  - Pub/sub for real-time

### Authentication

- **Passport.js**
  - JWT strategy
  - Local strategy
  - Extensible authentication

- **JWT (jsonwebtoken)**
  - Stateless authentication
  - Token-based security

- **bcrypt**
  - Password hashing
  - Salt rounds

- **speakeasy**
  - TOTP generation
  - MFA support

### Real-Time Communication

- **Socket.IO 4.8.1**
  - WebSocket abstraction
  - Room management
  - Fallback mechanisms

- **@nestjs/platform-socket.io**
  - NestJS WebSocket integration

### Payment Processing

- **Stripe 20.0.0**
  - Payment processing
  - Subscription management
  - Webhook handling

- **eSewa Integration**
  - Custom eSewa API integration
  - Nepalese payment gateway

### Email

- **Nodemailer 7.0.10**
  - SMTP email sending

- **Resend 3.5.0**
  - Modern email API
  - Better deliverability

### Validation

- **class-validator 0.14.0**
  - DTO validation
  - Decorator-based rules

- **class-transformer 0.5.1**
  - Object transformation
  - Serialization

### API Documentation

- **@nestjs/swagger 7.1.17**
  - OpenAPI/Swagger docs
  - Interactive API explorer

### Scheduling

- **@nestjs/schedule 6.0.1**
  - Cron jobs
  - Task scheduling

### Rate Limiting

- **@nestjs/throttler 5.0.1**
  - API rate limiting
  - DDoS protection

### Utilities

- **axios 1.13.2**: HTTP client
- **uuid 9.0.1**: UUID generation
- **qrcode 1.5.3**: QR code generation (MFA)

## Frontend Stack

### Core Framework

- **React 18.2.0**
  - Component-based UI
  - Virtual DOM
  - Hooks API

- **TypeScript 5.2.2**
  - Type safety
  - Better DX

### Build Tool

- **Vite 5.0.8**
  - Fast HMR
  - Optimized builds
  - Modern tooling

### Routing

- **react-router-dom 6.21.0**
  - Client-side routing
  - Protected routes
  - URL parameters

### State Management

- **Zustand 4.4.7**
  - Lightweight state
  - Simple API
  - Persistence

- **@tanstack/react-query 5.14.2**
  - Server state
  - Caching
  - Synchronization

### Forms

- **react-hook-form 7.49.2**
  - Form management
  - Validation

- **@hookform/resolvers 3.3.2**
  - Zod integration

- **zod 3.22.4**
  - Schema validation
  - Type inference

### Styling

- **Tailwind CSS 3.3.6**
  - Utility-first CSS
  - Responsive design
  - Custom theme

### HTTP Client

- **axios 1.6.2**
  - API requests
  - Interceptors
  - Error handling

### Real-Time

- **socket.io-client 4.8.1**
  - WebSocket client
  - Real-time updates

### UI Components

- **lucide-react 0.303.0**
  - Icon library
  - Modern icons

### Notifications

- **react-hot-toast 2.4.1**
  - Toast notifications
  - User feedback

### Utilities

- **date-fns 3.0.6**: Date formatting
- **qrcode.react 3.1.0**: QR code display (MFA)

## Development Tools

### Linting & Formatting

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript ESLint**: TS-specific rules

### Testing

- **Jest**: Unit testing
- **Supertest**: E2E testing
- **ts-jest**: TypeScript support

### Version Control

- **Git**: Source control
- **GitHub**: Repository hosting

## Deployment

### Backend

- **Node.js**: Runtime
- **PM2**: Process manager (production)
- **Docker**: Containerization (optional)

### Frontend

- **Vite Build**: Production build
- **Static Hosting**: CDN deployment
- **Nginx**: Reverse proxy (optional)

## Infrastructure

### Database

- **PostgreSQL**: Primary database
- **Connection Pooling**: TypeORM built-in

### Caching

- **Redis**: Session & cache storage

### File Storage

- **Local Filesystem**: Document storage
- **Future**: S3/Cloud Storage integration

## Security

### Authentication

- JWT tokens
- Refresh tokens
- MFA (TOTP)
- Password hashing (bcrypt)

### Authorization

- Role-based access control
- Permission system
- Route guards

### Data Protection

- Input validation
- SQL injection prevention (TypeORM)
- XSS protection
- CSRF protection (future)

## Monitoring & Logging

### Logging

- Console logging
- Error tracking
- Audit logs

### Future Enhancements

- APM tools (New Relic, Datadog)
- Error tracking (Sentry)
- Performance monitoring

## Package Management

- **npm**: Node package manager
- **package-lock.json**: Dependency locking

## Version Information

All versions are specified in:
- `package.json` (backend)
- `frontend/package.json` (frontend)

## Why These Technologies?

### NestJS
- Enterprise-ready
- Scalable architecture
- Great TypeScript support
- Active community

### React
- Component reusability
- Large ecosystem
- Performance
- Industry standard

### PostgreSQL
- Reliability
- Advanced features
- JSON support
- Performance

### TypeScript
- Type safety
- Better DX
- Refactoring support
- Team collaboration

### Redis
- Fast performance
- Session management
- Real-time features
- Scalability

