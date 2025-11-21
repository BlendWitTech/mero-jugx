# API Documentation

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

Most endpoints require authentication via JWT Bearer token.

### Getting a Token

1. Register an organization or login
2. Receive access token and refresh token
3. Include access token in Authorization header:

```
Authorization: Bearer {access_token}
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to get a new access token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

## API Endpoints

### Authentication (`/api/v1/auth`)

#### Register Organization
```http
POST /api/v1/auth/organization/register
Content-Type: application/json

{
  "organization": {
    "name": "Acme Corp",
    "slug": "acme-corp",
    "email": "contact@acme.com"
  },
  "user": {
    "email": "admin@acme.com",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response**: `201 Created`
```json
{
  "organization": { ... },
  "user": { ... },
  "tokens": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### Login
```http
POST /api/v1/auth/login?organization_id={org_id}
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: `200 OK`
```json
{
  "user": { ... },
  "organization": { ... },
  "tokens": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "requires_mfa": false
}
```

#### Verify Email
```http
GET /api/v1/auth/verify-email?token={verification_token}
```

**Response**: `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**: `200 OK`
```json
{
  "message": "Password reset email sent"
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "new_password": "NewSecurePassword123!"
}
```

**Response**: `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

**Response**: `200 OK`
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token"
}
```

#### Verify MFA and Login
```http
POST /api/v1/auth/verify-mfa
Content-Type: application/json

{
  "token": "temporary_token_from_login",
  "code": "123456"
}
```

**Response**: `200 OK`
```json
{
  "user": { ... },
  "organization": { ... },
  "tokens": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "token": "access_token_to_revoke"
}
```

**Response**: `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

### Organizations (`/api/v1/organizations`)

#### List Organizations
```http
GET /api/v1/organizations
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status

**Response**: `200 OK`
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### Get Organization
```http
GET /api/v1/organizations/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "email": "contact@acme.com",
  ...
}
```

#### Update Organization
```http
PATCH /api/v1/organizations/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Name",
  ...
}
```

#### Delete Organization
```http
DELETE /api/v1/organizations/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "Organization deleted successfully"
}
```

### Users (`/api/v1/users`)

#### List Users
```http
GET /api/v1/users
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `status`: Filter by status
- `organization_id`: Filter by organization

**Response**: `200 OK`
```json
{
  "data": [ ... ],
  "meta": { ... }
}
```

#### Get User
```http
GET /api/v1/users/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  ...
}
```

#### Update User
```http
PATCH /api/v1/users/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "Jane",
  "phone": "+1234567890"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "first_name": "Jane",
  ...
}
```

#### Delete User
```http
DELETE /api/v1/users/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

### Roles (`/api/v1/roles`)

#### List Roles
```http
GET /api/v1/roles
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `organization_id`: Filter by organization
- `is_active`: Filter by active status

**Response**: `200 OK`
```json
{
  "data": [ ... ]
}
```

#### Create Role
```http
POST /api/v1/roles
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Manager",
  "slug": "manager",
  "description": "Manager role",
  "permission_ids": [1, 2, 3]
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "name": "Manager",
  ...
}
```

#### Update Role
```http
PATCH /api/v1/roles/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Senior Manager",
  "permission_ids": [1, 2, 3, 4]
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Senior Manager",
  ...
}
```

#### Delete Role
```http
DELETE /api/v1/roles/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "Role deleted successfully"
}
```

### Invitations (`/api/v1/invitations`)

#### List Invitations
```http
GET /api/v1/invitations
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `organization_id`: Filter by organization
- `status`: Filter by status (pending, accepted, expired, cancelled)

**Response**: `200 OK`
```json
{
  "data": [ ... ]
}
```

#### Create Invitation
```http
POST /api/v1/invitations
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role_id": 2,
  "message": "Welcome to our organization!"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "token": "invitation_token",
  ...
}
```

#### Accept Invitation
```http
POST /api/v1/invitations/{id}/accept
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "Invitation accepted successfully",
  "membership": { ... }
}
```

#### Cancel Invitation
```http
DELETE /api/v1/invitations/{id}
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "Invitation cancelled successfully"
}
```

### MFA (`/api/v1/mfa`)

#### Setup MFA
```http
POST /api/v1/mfa/setup
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "secret": "base32_secret",
  "qr_code": "data:image/png;base64,...",
  "backup_codes": ["code1", "code2", ...]
}
```

#### Verify MFA Setup
```http
POST /api/v1/mfa/verify
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "123456"
}
```

**Response**: `200 OK`
```json
{
  "message": "MFA enabled successfully"
}
```

#### Disable MFA
```http
POST /api/v1/mfa/disable
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "password": "user_password"
}
```

**Response**: `200 OK`
```json
{
  "message": "MFA disabled successfully"
}
```

### Packages (`/api/v1/packages`)

#### List Packages
```http
GET /api/v1/packages
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "data": [ ... ]
}
```

#### Upgrade Package
```http
POST /api/v1/packages/upgrade
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "package_id": 2,
  "organization_id": "uuid"
}
```

**Response**: `200 OK`
```json
{
  "message": "Package upgraded successfully",
  "organization": { ... }
}
```

### Notifications (`/api/v1/notifications`)

#### List Notifications
```http
GET /api/v1/notifications
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `read`: Filter by read status (true/false)
- `organization_id`: Filter by organization

**Response**: `200 OK`
```json
{
  "data": [ ... ]
}
```

#### Mark as Read
```http
PATCH /api/v1/notifications/{id}/read
Authorization: Bearer {access_token}
```

**Response**: `200 OK`
```json
{
  "message": "Notification marked as read"
}
```

### Audit Logs (`/api/v1/audit-logs`)

#### List Audit Logs
```http
GET /api/v1/audit-logs
Authorization: Bearer {access_token}
```

**Query Parameters**:
- `organization_id`: Filter by organization
- `user_id`: Filter by user
- `action`: Filter by action
- `start_date`: Start date filter
- `end_date`: End date filter
- `page`: Page number
- `limit`: Items per page

**Response**: `200 OK`
```json
{
  "data": [ ... ],
  "meta": { ... }
}
```

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email"
    }
  ]
}
```

### Common Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

API endpoints are rate-limited:
- **Default**: 10 requests per minute per IP
- **Authentication endpoints**: Stricter limits apply

Rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1234567890
```

## Interactive API Documentation

When the server is running, visit:
```
http://localhost:3000/api/docs
```

This provides an interactive Swagger UI where you can:
- Explore all endpoints
- Test API calls
- View request/response schemas
- See authentication requirements

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Filtering & Searching

Many list endpoints support filtering:

- `search`: Full-text search across relevant fields
- `status`: Filter by status enum values
- `organization_id`: Filter by organization
- `created_at`: Date range filtering

## Sorting

Sorting is supported via query parameters:
- `sort`: Field to sort by
- `order`: Sort order (asc, desc)

Example:
```
GET /api/v1/users?sort=created_at&order=desc
```

