# System Architecture

## Overview

Mero Jugx is a multi-tenant, organization-based authentication and user management system built with NestJS (backend) and React (frontend). The system supports multiple organizations, role-based access control, subscription packages, real-time communication, and payment processing.

## Architecture Pattern

The system follows a **modular monolith architecture** with clear separation of concerns:

- **Backend**: NestJS modules with dependency injection
- **Frontend**: React with component-based architecture
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis for session management and token blacklisting
- **Real-time**: Socket.IO for WebSocket communication

## System Components

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS Application                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Auth   │  │   Users  │  │   Roles  │  │ Packages│ │
│  │  Module  │  │  Module  │  │  Module  │  │ Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Organizat.│  │ Payments │  │   Chat   │  │ Notif.  │ │
│  │  Module  │  │  Module  │  │  Module  │  │ Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │            Common Module (Guards, Filters)         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │PostgreSQL│         │  Redis  │         │Socket.IO│
    └─────────┘          └─────────┘          └─────────┘
```

### Module Structure

#### 1. Auth Module
- **Purpose**: Handles authentication and authorization
- **Key Components**:
  - JWT strategy for token-based authentication
  - Local strategy for email/password login
  - MFA (Multi-Factor Authentication) support
  - Email verification
  - Password reset functionality
- **Dependencies**: Users module, Organizations module

#### 2. Users Module
- **Purpose**: User management and profile operations
- **Key Components**:
  - User CRUD operations
  - Profile management
  - Password change
  - User impersonation (for admins)
  - Data export (GDPR compliance)
- **Dependencies**: Organizations module, Roles module

#### 3. Organizations Module
- **Purpose**: Organization management and multi-tenancy
- **Key Components**:
  - Organization CRUD
  - Organization switching
  - Slug management
  - Document management
  - Organization settings
- **Dependencies**: Packages module, Users module

#### 4. Roles Module
- **Purpose**: Role-based access control (RBAC)
- **Key Components**:
  - Role management
  - Permission assignment
  - Role templates
  - Role hierarchy
- **Dependencies**: Permissions (embedded)

#### 5. Packages Module
- **Purpose**: Subscription and package management
- **Key Components**:
  - Package management
  - Feature management
  - Package expiration handling
  - Auto-renewal
  - Upgrade price calculation
- **Dependencies**: Organizations module

#### 6. Payments Module
- **Purpose**: Payment processing
- **Key Components**:
  - Stripe integration
  - eSewa integration
  - Payment verification
  - Payment history
- **Dependencies**: Packages module, Organizations module

#### 7. Chat Module
- **Purpose**: Real-time communication
- **Key Components**:
  - WebSocket gateway (Socket.IO)
  - Chat management (direct and group)
  - Message handling
  - WebRTC for audio/video calls
  - Call session management
- **Dependencies**: Users module, Organizations module

#### 8. Notifications Module
- **Purpose**: Notification system
- **Key Components**:
  - In-app notifications
  - Email notifications
  - Notification preferences
  - Notification delivery
- **Dependencies**: Users module, Organizations module

#### 9. Audit Logs Module
- **Purpose**: Activity tracking and compliance
- **Key Components**:
  - Audit log creation
  - Log querying
  - Activity statistics
- **Dependencies**: All modules (via decorators)

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pages      │  │  Components  │  │   Services   │  │
│  │              │  │              │  │              │  │
│  │ - Auth       │  │ - Layouts    │  │ - API Client │  │
│  │ - Dashboard  │  │ - Forms      │  │ - Chat       │  │
│  │ - Users      │  │ - Modals     │  │ - WebRTC     │  │
│  │ - Roles      │  │ - Lists      │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Store    │  │    Hooks     │  │    Utils     │  │
│  │  (Zustand)  │  │              │  │             │  │
│  │             │  │ - Permissions│  │ - Currency  │  │
│  │ - Auth      │  │ - Queries    │  │ - Formatting│  │
│  │ - User      │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │  API    │
    │ (Axios) │
    └─────────┘
```

## Data Flow

### Authentication Flow

```
User → Frontend → Auth API → JWT Token → Store Token
                                    ↓
                            Protected Routes
                                    ↓
                            API Requests with Token
                                    ↓
                            Backend Validation
                                    ↓
                            Resource Access
```

### Multi-Organization Flow

```
User Login → Select Organization → JWT with org_id
                                        ↓
                            All requests include org context
                                        ↓
                            Data filtered by organization
```

### Real-Time Communication Flow

```
Client → Socket.IO Connection → Authentication
                                        ↓
                            Join organization room
                                        ↓
                            Listen for events
                                        ↓
                            Send/Receive messages
```

## Security Architecture

### Authentication Layers

1. **JWT Tokens**: Stateless authentication
2. **Refresh Tokens**: Stored in Redis with expiration
3. **MFA**: TOTP-based two-factor authentication
4. **Session Management**: Redis-based session storage

### Authorization Layers

1. **Guards**: Route-level protection
2. **Decorators**: Method-level permissions
3. **Role Hierarchy**: Prevents privilege escalation
4. **Permission Checks**: Granular access control

### Data Protection

1. **Password Hashing**: bcrypt with salt rounds
2. **Token Blacklisting**: Redis for revoked tokens
3. **Rate Limiting**: Throttler for API protection
4. **Input Validation**: class-validator DTOs
5. **SQL Injection Prevention**: TypeORM parameterized queries

## Scalability Considerations

### Horizontal Scaling

- **Stateless Backend**: JWT tokens enable load balancing
- **Redis**: Shared session storage across instances
- **Database**: PostgreSQL with connection pooling
- **WebSocket**: Socket.IO with Redis adapter for multi-server

### Performance Optimizations

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Eager loading, pagination
- **Caching**: Redis for frequently accessed data
- **Lazy Loading**: Frontend code splitting

## Deployment Architecture

```
┌─────────────┐
│   Frontend   │ → CDN/Static Hosting
│   (React)    │
└─────────────┘

┌─────────────┐
│   Backend   │ → Application Server
│   (NestJS)  │
└─────────────┘
      │
      ├──→ PostgreSQL (Primary DB)
      ├──→ Redis (Cache/Sessions)
      └──→ File Storage (Documents)
```

## Technology Decisions

### Why NestJS?
- Modular architecture
- Dependency injection
- Built-in TypeScript support
- Excellent for enterprise applications

### Why React?
- Component reusability
- Large ecosystem
- Performance with virtual DOM
- Strong TypeScript support

### Why PostgreSQL?
- ACID compliance
- JSON support
- Advanced features (full-text search, arrays)
- Excellent performance

### Why Redis?
- Fast in-memory storage
- Pub/sub for real-time features
- Session management
- Token blacklisting

### Why Socket.IO?
- WebSocket abstraction
- Fallback mechanisms
- Room management
- Built-in authentication

## Future Considerations

- **Microservices**: Potential split for chat/payments
- **Message Queue**: RabbitMQ/Kafka for async processing
- **Search**: Elasticsearch for advanced search
- **Monitoring**: APM tools (New Relic, Datadog)
- **CI/CD**: Automated testing and deployment

