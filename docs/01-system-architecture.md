# System Architecture

## Overview

Mero Jugx is an organization-based authentication and user management system built with a modern microservices-oriented architecture using NestJS for the backend and React for the frontend.

## Architecture Pattern

The system follows a **modular monolith** architecture pattern, where:

- **Backend**: NestJS application with feature-based modules
- **Frontend**: React SPA (Single Page Application) with Vite
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and caching (optional)

## System Components

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS Application                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   Auth       │  │ Organizations│  │    Users      ││
│  │   Module     │  │   Module    │  │   Module     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Invitations  │  │    Roles     │  │  Packages    ││
│  │   Module     │  │   Module     │  │   Module     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │     MFA      │  │Notifications │  │  Audit Logs  ││
│  │   Module     │  │   Module     │  │   Module     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Common Module                          │  │
│  │  (Guards, Decorators, Interceptors, Services)   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Module Structure

Each module follows NestJS best practices:

- **Controller**: Handles HTTP requests and responses
- **Service**: Contains business logic
- **DTOs**: Data Transfer Objects for validation
- **Entities**: Database models (TypeORM)
- **Guards**: Authentication and authorization
- **Decorators**: Custom metadata decorators

### Core Modules

#### 1. Auth Module
- User authentication (login/logout)
- Organization registration
- JWT token management
- Password reset flow
- Email verification

#### 2. Organizations Module
- Organization CRUD operations
- Organization settings management
- Package management per organization

#### 3. Users Module
- User profile management
- User CRUD operations
- User status management

#### 4. Roles Module
- Role creation and management
- Permission assignment
- Role-based access control (RBAC)

#### 5. Invitations Module
- Send invitations to join organizations
- Accept/reject invitations
- Invitation status tracking

#### 6. Packages Module
- Package management
- Feature upgrades
- Package limits enforcement

#### 7. MFA Module
- Two-factor authentication setup
- TOTP (Time-based One-Time Password) generation
- MFA verification

#### 8. Notifications Module
- In-app notifications
- Notification management
- Read/unread tracking

#### 9. Audit Logs Module
- Activity logging
- Audit trail queries
- Compliance tracking

### Common Module

Shared functionality across all modules:

- **Guards**: JWT authentication, permissions, roles
- **Decorators**: `@CurrentUser`, `@CurrentOrganization`, `@Roles`, `@Permissions`, `@Public`
- **Interceptors**: Response transformation, error handling
- **Services**: Email service, Redis service, email templates
- **Filters**: Exception filters for error handling

## Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Application (Vite)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Routing Layer                       │  │
│  │         (React Router DOM)                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   Auth       │  │  Dashboard    │  │ Organizations││
│  │   Pages      │  │   Pages       │  │    Pages     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │    Users     │  │    Roles     │  │ Invitations  ││
│  │   Pages      │  │   Pages      │  │    Pages     ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Services Layer                          │  │
│  │  (API Client, Auth Service, State Management)    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Frontend Structure

- **Pages**: Route-based page components
- **Layouts**: Shared layout components (DashboardLayout)
- **Services**: API communication layer
- **Store**: State management (Zustand)
- **Components**: Reusable UI components

### State Management

- **Zustand**: Global state management
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management

## Data Flow

### Authentication Flow

```
1. User submits login credentials
   ↓
2. Frontend sends POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT tokens (access + refresh)
   ↓
5. Backend creates session record
   ↓
6. Frontend stores tokens and user info
   ↓
7. Frontend redirects to dashboard
```

### Request Flow (Authenticated)

```
1. Frontend makes API request with JWT token
   ↓
2. JwtAuthGuard validates token
   ↓
3. PermissionsGuard checks permissions
   ↓
4. Controller receives request
   ↓
5. Service executes business logic
   ↓
6. Database query executed
   ↓
7. Response transformed by interceptor
   ↓
8. Frontend receives response
```

## Security Architecture

### Authentication
- JWT-based authentication
- Refresh token rotation
- Session management
- Password hashing (bcrypt)

### Authorization
- Role-based access control (RBAC)
- Permission-based access control
- Organization-scoped resources
- Multi-factor authentication (MFA)

### Security Features
- Rate limiting (Throttler)
- CORS configuration
- Input validation (class-validator)
- SQL injection prevention (TypeORM)
- XSS protection
- CSRF protection

## Database Architecture

- **PostgreSQL**: Primary database
- **TypeORM**: ORM for database operations
- **Migrations**: Version-controlled schema changes
- **Seeds**: Initial data population

See [Database Schema](./02-database-schema.md) for detailed information.

## API Architecture

- **RESTful API**: Standard REST endpoints
- **OpenAPI/Swagger**: API documentation
- **Versioning**: `/api/v1/` prefix
- **Error Handling**: Standardized error responses
- **Validation**: DTO-based validation

See [API Documentation](./API-DOCUMENTATION.md) for detailed endpoints.

## Deployment Architecture

### Development
- Backend: `npm run start:dev` (port 3000)
- Frontend: `npm run dev` (port 3001)
- Hot reload enabled

### Production
- Backend: Built and served with Node.js
- Frontend: Static files served via CDN or web server
- Database: PostgreSQL (managed or self-hosted)
- Redis: Optional for caching/sessions

See [Deployment Guide](./DEPLOYMENT-GUIDE.md) for detailed instructions.

