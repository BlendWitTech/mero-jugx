# Developer Guide

## Overview

This guide provides detailed explanations of every function, module, and component in the Mero Jugx codebase, explaining **why** it exists, **how** it works, and **what** it does.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Core Services](#core-services)
5. [Authentication System](#authentication-system)
6. [Authorization System](#authorization-system)
7. [Database Layer](#database-layer)
8. [API Layer](#api-layer)
9. [Real-Time Communication](#real-time-communication)
10. [Payment Processing](#payment-processing)
11. [Notification System](#notification-system)

## Project Structure

### Backend Structure

```
src/
├── auth/              # Authentication module
├── users/              # User management
├── organizations/      # Organization management
├── roles/              # Role-based access control
├── packages/           # Package/subscription management
├── payments/           # Payment processing
├── chat/               # Real-time chat and calls
├── notifications/      # Notification system
├── invitations/        # User invitations
├── mfa/                # Multi-factor authentication
├── audit-logs/         # Activity logging
├── common/             # Shared utilities
├── database/           # Database entities, migrations, seeds
└── config/             # Configuration files
```

### Frontend Structure

```
frontend/src/
├── components/         # Reusable React components
├── pages/             # Page components
├── services/          # API service layer
├── store/             # State management (Zustand)
├── hooks/             # Custom React hooks
├── layouts/           # Layout components
└── utils/             # Utility functions
```

## Backend Architecture

### Module System

**Why**: NestJS uses a modular architecture for better organization and dependency management.

**How**: Each feature is a module that exports controllers, services, and can import other modules.

**What**: Modules encapsulate related functionality and manage dependencies.

#### Example: AuthModule

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, OrganizationMember, ...]),
    JwtModule.registerAsync({ ... }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Why**: 
- Encapsulates all authentication logic
- Manages dependencies (repositories, JWT, email)
- Exports AuthService for use in other modules

**How**:
- Imports TypeORM entities for database access
- Registers JWT module for token generation
- Provides services and strategies

**What**: Handles user registration, login, token generation, email verification, password reset.

### Dependency Injection

**Why**: Enables loose coupling, testability, and easier maintenance.

**How**: NestJS automatically resolves dependencies through constructor injection.

**What**: Services receive their dependencies as constructor parameters.

#### Example

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}
}
```

**Why**: 
- Easy to mock for testing
- Clear dependencies
- Automatic resolution

**How**: 
- `@InjectRepository` decorator tells NestJS to inject TypeORM repository
- Other services injected via constructor

**What**: Provides AuthService with database access, JWT generation, and email sending.

## Core Services

### AuthService

#### `validateUser(email: string, password: string)`

**Why**: Validates user credentials during login.

**How**:
1. Finds user by email and active status
2. Compares provided password with stored hash using bcrypt
3. Returns user if valid, null otherwise

**What**: Returns User entity if credentials are valid.

```typescript
async validateUser(email: string, password: string): Promise<User | null> {
  const user = await this.userRepository.findOne({
    where: { email, status: UserStatus.ACTIVE },
  });
  
  if (!user) return null;
  
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  return isPasswordValid ? user : null;
}
```

**Security**: Uses bcrypt for password comparison (constant-time operation prevents timing attacks).

#### `registerOrganization(dto: RegisterOrganizationDto)`

**Why**: Creates a new organization and owner account in a single transaction.

**How**:
1. Starts database transaction
2. Validates organization name/email uniqueness
3. Generates organization slug from name
4. Creates organization with Freemium package
5. Hashes user password
6. Creates user account
7. Creates organization owner role
8. Creates membership linking user to organization
9. Generates email verification tokens
10. Sends verification emails
11. Commits transaction (or rolls back on error)

**What**: Returns success message with organization and user IDs.

**Transaction Safety**: Uses QueryRunner to ensure atomicity - if any step fails, entire operation rolls back.

#### `login(dto: LoginDto, organizationId: string)`

**Why**: Authenticates user and generates JWT tokens for a specific organization.

**How**:
1. Validates credentials using `validateUser`
2. Verifies user is member of organization
3. Checks MFA status (if enabled, requires MFA code)
4. Creates session record
5. Generates access token (15min expiry)
6. Generates refresh token (7 days expiry)
7. Stores refresh token in Redis
8. Returns tokens and user/org data

**What**: Returns JWT tokens and user/organization information.

**Token Storage**: Refresh tokens stored in Redis for fast revocation and validation.

#### `generateTokens(user: User, organizationId: string)`

**Why**: Centralizes token generation logic for consistency.

**How**:
1. Creates JWT payload with user ID, email, organization ID, role ID
2. Signs access token with JWT_SECRET (15min expiry)
3. Signs refresh token with JWT_REFRESH_SECRET (7 days expiry)
4. Stores refresh token in Redis with expiration

**What**: Returns access and refresh tokens.

**Security**: Different secrets for access/refresh tokens, Redis storage enables blacklisting.

### UsersService

#### `getCurrentUser(userId: string, organizationId: string)`

**Why**: Retrieves current user's profile with role and permissions.

**How**:
1. Finds active membership for user in organization
2. Loads user, role, and permissions relations
3. If organization owner, grants all permissions
4. Otherwise, loads permissions from role
5. Returns user with role and permissions array

**What**: Returns user entity with role and permissions.

**Permission Resolution**: Organization owners bypass permission checks (have all permissions).

#### `getOrganizationUsers(userId: string, organizationId: string, query: UserQueryDto)`

**Why**: Lists organization users with pagination and search.

**How**:
1. Checks user has `users.view` permission
2. Builds query with search filter (name/email)
3. Loads members with user and role relations
4. Applies pagination (page, limit)
5. Maps to user objects with role information
6. Returns paginated results

**What**: Returns paginated list of organization users.

**Permission Model**: All users with `users.view` can see all organization users (no role hierarchy filtering for visibility).

#### `updateUser(userId: string, organizationId: string, targetUserId: string, dto: UpdateUserAdminDto)`

**Why**: Allows admins to update user profiles.

**How**:
1. Checks user has `users.edit` permission
2. Verifies target user exists in organization
3. Checks role hierarchy (can't edit same/higher role)
4. Validates email uniqueness if changed
5. Updates user fields
6. Creates audit log
7. Sends notification if email changed

**What**: Returns updated user entity.

**Role Hierarchy**: Prevents privilege escalation by blocking edits to users with same/higher roles.

#### `changePassword(userId: string, organizationId: string, currentPassword: string, newPassword: string)`

**Why**: Allows users to change their own password securely.

**How**:
1. Finds user by ID
2. Verifies current password using bcrypt
3. Hashes new password with bcrypt (10 salt rounds)
4. Updates password and `password_changed_at` timestamp
5. Invalidates all user sessions (except current)
6. Creates audit log

**What**: Returns success message.

**Security**: Invalidates all sessions to prevent unauthorized access with old password.

### OrganizationsService

#### `getCurrentOrganization(userId: string, organizationId: string)`

**Why**: Retrieves current organization with package and limits.

**How**:
1. Verifies user membership
2. Loads organization with package relation
3. Calculates current limits (base + features)
4. Returns organization with limits

**What**: Returns organization entity with calculated limits.

#### `switchOrganization(userId: string, organizationId: string)`

**Why**: Allows users to switch between organizations they belong to.

**How**:
1. Verifies user is member of target organization
2. Loads organization with package
3. Generates new JWT tokens with new organization context
4. Returns new tokens and organization data

**What**: Returns new access/refresh tokens and organization.

**Token Regeneration**: New tokens ensure organization context is correct in JWT payload.

#### `updateOrganizationSlug(userId: string, organizationId: string, newSlug: string)`

**Why**: Allows organization owners to customize their organization URL.

**How**:
1. Verifies user is organization owner
2. Checks organization package allows slug changes (Basic/Platinum/Diamond)
3. Validates slug format (lowercase, alphanumeric, hyphens)
4. Checks slug uniqueness
5. Updates organization slug
6. Creates audit log

**What**: Returns updated organization.

**Package Restriction**: Freemium packages cannot change slug (set at registration).

### ChatService

#### `hasChatAccess(userId: string, organizationId: string)`

**Why**: Checks if user/organization has access to chat feature.

**How**:
1. Loads organization with package
2. Checks if package includes chat (Platinum/Diamond)
3. Checks if organization purchased chat feature
4. Returns boolean

**What**: Returns true if chat access is available.

**Feature Gating**: Chat is a premium feature requiring specific package or feature purchase.

#### `createChat(userId: string, organizationId: string, dto: CreateChatDto)`

**Why**: Creates a new chat (direct or group).

**How**:
1. Verifies chat access
2. For direct chat: finds or creates chat between two users
3. For group chat: creates new chat with name/description
4. Adds members to chat
5. Creates chat memberships
6. Returns chat with members

**What**: Returns created chat entity.

**Direct Chat Logic**: Ensures only one direct chat exists between two users.

#### `getMessages(chatId: string, userId: string, organizationId: string, query: MessageQueryDto)`

**Why**: Retrieves chat messages with pagination.

**How**:
1. Verifies user is chat member
2. Applies default pagination (page=1, limit=50)
3. Queries messages ordered by created_at DESC
4. Loads sender information
5. Returns paginated messages

**What**: Returns paginated message list.

**Pagination**: Defaults prevent NaN errors when query object is empty.

### PaymentsService

#### `createPayment(dto: CreatePaymentDto)`

**Why**: Initiates payment process for packages or features.

**How**:
1. Validates payment type and amount
2. Selects payment gateway based on configuration
3. For Stripe: Creates checkout session
4. For eSewa: Creates payment form data
5. Creates payment record (PENDING status)
6. Returns payment form/redirect URL

**What**: Returns payment form data or redirect URL.

**Gateway Selection**: Stripe for USD, eSewa for NPR (based on user region or selection).

#### `verifyPayment(paymentId: string, transactionId: string)`

**Why**: Verifies payment completion after gateway redirect.

**How**:
1. Finds payment record
2. Verifies with payment gateway API
3. Updates payment status to COMPLETED
4. Applies package upgrade or feature activation
5. Updates organization limits
6. Sends confirmation email

**What**: Returns verified payment record.

**Idempotency**: Verification can be called multiple times safely.

## Frontend Architecture

### State Management

#### AuthStore (Zustand)

**Why**: Centralized authentication state accessible throughout the app.

**How**:
- Stores user, organization, tokens
- Persists to localStorage
- Provides actions: login, logout, setOrganization

**What**: Single source of truth for auth state.

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  // ... actions
}
```

**Persistence**: Uses Zustand's persist middleware to survive page refreshes.

### API Service Layer

#### `api.ts` - Axios Instance

**Why**: Centralized HTTP client with interceptors for auth and error handling.

**How**:
1. Creates axios instance with base URL
2. Request interceptor: Adds JWT token to headers
3. Response interceptor: Handles 401 (token refresh)
4. Error interceptor: Shows user-friendly error messages

**What**: Provides authenticated API client.

**Token Refresh**: Automatically refreshes expired tokens and retries failed requests.

#### `chatService.ts` - Chat API

**Why**: Encapsulates chat-related API calls.

**Functions**:
- `createChat()`: Creates new chat
- `getChats()`: Lists user's chats
- `getMessages()`: Gets chat messages
- `sendMessage()`: Sends message
- `connectSocket()`: Establishes WebSocket connection

**Socket Management**: Handles connection, reconnection, and event listeners.

### Component Architecture

#### `ChatWindow.tsx`

**Why**: Displays chat interface with messages and input.

**How**:
1. Loads chat data on mount
2. Establishes WebSocket connection
3. Listens for new messages
4. Sends messages via WebSocket
5. Manages message state
6. Handles call initiation

**What**: Renders chat UI with real-time updates.

**State Management**:
- `messages`: Array of messages
- `socket`: WebSocket connection
- `activeCall`: Current call state

#### `ChatManager.tsx`

**Why**: Manages multiple chat windows (Messenger-style).

**How**:
1. Maintains array of open chats
2. Limits to 3 open windows
3. Minimizes oldest when limit reached
4. Positions windows side-by-side
5. Handles minimize/restore

**What**: Provides multi-chat window management.

**Window Management**: Uses absolute positioning to stack windows from right.

## Database Layer

### Entity Relationships

#### User ↔ Organization (Many-to-Many)

**Why**: Users can belong to multiple organizations.

**How**: Junction table `organization_members` with:
- `user_id`, `organization_id`: Foreign keys
- `role_id`: User's role in organization
- `status`: Membership status

**What**: Enables multi-tenant architecture.

#### Organization → Package (Many-to-One)

**Why**: Each organization has one active package.

**How**: `organizations.package_id` foreign key.

**What**: Determines organization's features and limits.

### Migrations

**Why**: Version-controlled database schema changes.

**How**:
1. Generate migration: `npm run migration:generate`
2. Review generated SQL
3. Run migration: `npm run migration:run`
4. Revert if needed: `npm run migration:revert`

**What**: Applies schema changes safely.

**Best Practices**:
- Never modify existing migrations
- Test migrations on staging first
- Use transactions for data migrations

### Seeds

**Why**: Populates database with initial data.

**How**:
1. Seeds run after migrations
2. Check for existing data (idempotent)
3. Create/update records
4. Log results

**What**: Provides default packages, features, permissions, roles.

**Idempotency**: Seeds can run multiple times safely (updates existing records).

## API Layer

### Controllers

**Why**: Handle HTTP requests and responses.

**How**:
- Route decorators (`@Get`, `@Post`, etc.)
- Parameter extraction (`@Body`, `@Param`, `@Query`)
- Guard application (`@UseGuards`)
- Permission checks (`@Permissions`)

**What**: Expose REST endpoints.

### Guards

#### `JwtAuthGuard`

**Why**: Protects routes requiring authentication.

**How**:
1. Extracts token from Authorization header
2. Validates token with JwtStrategy
3. Attaches user to request object
4. Allows/denies request

**What**: Ensures user is authenticated.

#### `PermissionsGuard`

**Why**: Enforces permission-based access control.

**How**:
1. Reads `@Permissions()` decorator
2. Gets user's permissions from request
3. Checks if user has required permission
4. Allows/denies request

**What**: Enforces granular permissions.

### Decorators

#### `@CurrentUser()`

**Why**: Extracts authenticated user from request.

**How**: Reads `request.user` set by JwtAuthGuard.

**What**: Returns user object with userId, organizationId, roleId.

#### `@CurrentOrganization('id')`

**Why**: Extracts organization ID from request.

**How**: 
1. Prioritizes `request.user.organizationId` (string)
2. Falls back to `request.user.membership.organization.id`
3. Returns ID string when parameter is 'id'

**What**: Returns organization ID or full object.

**Fix History**: Previously returned full object, causing UUID errors. Now correctly returns ID string.

## Real-Time Communication

### WebSocket Gateway

#### `ChatGateway`

**Why**: Handles real-time chat via WebSocket.

**How**:
1. Authenticates connection using JWT
2. Joins user to organization room
3. Handles message events
4. Broadcasts to chat room
5. Manages call signaling

**What**: Enables real-time messaging and calls.

**Events**:
- `message:send`: Client sends message
- `message:new`: Server broadcasts new message
- `call:offer`: Initiate call
- `call:answer`: Answer call

### WebRTC Integration

**Why**: Peer-to-peer audio/video calls.

**How**:
1. Client initiates call via WebSocket
2. Server signals other participant
3. Clients exchange WebRTC offers/answers
4. ICE candidates exchanged
5. Direct peer connection established

**What**: Enables audio/video communication.

**Signaling**: WebSocket used for signaling, WebRTC for media.

## Payment Processing

### Stripe Integration

**Why**: Process USD payments.

**How**:
1. Create Stripe checkout session
2. Redirect user to Stripe
3. User completes payment
4. Stripe redirects back with session ID
5. Verify payment server-side
6. Activate package/feature

**What**: Handles subscription and one-time payments.

### eSewa Integration

**Why**: Process NPR payments (Nepal).

**How**:
1. Create payment form data
2. Submit form to eSewa RC/production
3. User completes payment
4. eSewa redirects back
5. Verify payment via eSewa API
6. Activate package/feature

**What**: Handles Nepalese payment gateway.

**Mock Mode**: Development mode bypasses actual eSewa for testing.

## Notification System

### NotificationHelperService

**Why**: Centralized notification creation logic.

**How**:
1. Checks notification preferences
2. Creates in-app notification
3. Sends email if enabled
4. Respects user preferences

**What**: Creates and delivers notifications.

**Preference System**: 
- Global toggles (email_enabled, in_app_enabled)
- Per-type preferences (user_invitations, role_changes, etc.)
- Important notifications always sent

## Common Patterns

### Error Handling

**Why**: Consistent error responses across API.

**How**:
- `AllExceptionsFilter`: Catches all exceptions
- Formats error response
- Logs error details
- Returns user-friendly message

**What**: Provides consistent error format.

### Validation

**Why**: Ensure data integrity.

**How**:
- DTOs with `class-validator` decorators
- Global ValidationPipe
- Automatic validation on requests

**What**: Validates request data before processing.

### Audit Logging

**Why**: Track all system changes for compliance.

**How**:
- `@AuditLog()` decorator on services
- Logs action, entity, old/new values
- Stores in audit_logs table

**What**: Complete activity trail.

## Testing

### Unit Tests

**Why**: Verify individual functions work correctly.

**How**: Jest with mocked dependencies.

**What**: Tests service methods in isolation.

### E2E Tests

**Why**: Verify complete user flows.

**How**: Supertest with test database.

**What**: Tests API endpoints end-to-end.

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Validate input** with DTOs
3. **Check permissions** before operations
4. **Log important actions** for audit
5. **Handle errors gracefully** with user-friendly messages
6. **Use type safety** (TypeScript)
7. **Follow REST conventions** for API design
8. **Document complex logic** with comments
9. **Test edge cases** (empty data, null values)
10. **Optimize queries** (use indexes, pagination)

