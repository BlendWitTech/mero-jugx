# API Documentation

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://yourdomain.com/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Endpoints

### Authentication (`/auth`)

#### Register Organization
```http
POST /auth/organization/register
Content-Type: application/json

{
  "organization_name": "Acme Corp",
  "organization_email": "contact@acme.com",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@acme.com",
  "password": "SecurePassword123!"
}
```

**Response**: `201 Created`
```json
{
  "message": "Organization registered successfully",
  "user_id": "uuid",
  "organization_id": "uuid"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@acme.com",
  "password": "SecurePassword123!",
  "organization_id": "uuid" // Optional
}
```

**Response**: `200 OK`
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": { ... },
  "organization": { ... }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token"
}
```

#### Verify Email
```http
GET /auth/verify-email?token=verification_token
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "new_password": "NewPassword123!"
}
```

#### Verify MFA
```http
POST /auth/verify-mfa
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "mfa_code": "123456",
  "organization_id": "uuid"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Users (`/users`)

#### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

#### Update Current User
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "avatar_url": "https://..."
}
```

#### Change Password
```http
PUT /users/me/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### List Organization Users
```http
GET /users?page=1&limit=10&search=john
Authorization: Bearer <token>
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term (name/email)

#### Get User by ID
```http
GET /users/:id
Authorization: Bearer <token>
```

#### Update User (Admin)
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "status": "active"
}
```

#### Revoke User Access
```http
POST /users/:id/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Violation of terms"
}
```

#### Download User Data (GDPR)
```http
GET /users/me/download-data
Authorization: Bearer <token>
```

### Organizations (`/organizations`)

#### Get Current Organization
```http
GET /organizations/me
Authorization: Bearer <token>
```

#### List User Organizations
```http
GET /organizations
Authorization: Bearer <token>
```

#### Update Organization
```http
PUT /organizations/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

#### Update Organization Settings
```http
PUT /organizations/me/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": { ... }
}
```

#### Get Organization Statistics
```http
GET /organizations/me/stats
Authorization: Bearer <token>
```

#### Switch Organization
```http
PUT /organizations/switch
Authorization: Bearer <token>
Content-Type: application/json

{
  "organization_id": "uuid"
}
```

**Response**: Returns new access and refresh tokens

#### Update Organization Slug
```http
PUT /organizations/me/slug
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "new-slug"
}
```

**Note**: Only available for Basic, Platinum, and Diamond packages

### Roles (`/roles`)

#### List Roles
```http
GET /roles?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Role by ID
```http
GET /roles/:id
Authorization: Bearer <token>
```

#### Create Role
```http
POST /roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Manager",
  "slug": "manager",
  "description": "Manager role",
  "permissions": ["users.view", "users.edit"]
}
```

#### Update Role
```http
PUT /roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Senior Manager",
  "permissions": ["users.view", "users.edit", "roles.view"]
}
```

#### Delete Role
```http
DELETE /roles/:id
Authorization: Bearer <token>
```

#### Get Permissions
```http
GET /roles/permissions
Authorization: Bearer <token>
```

#### Get Role Usage Counts
```http
GET /roles/usage-counts
Authorization: Bearer <token>
```

### Packages (`/packages`)

#### List Packages
```http
GET /packages
Authorization: Bearer <token>
```

#### List Package Features
```http
GET /packages/features
Authorization: Bearer <token>
```

#### Get Package by ID
```http
GET /packages/:id
Authorization: Bearer <token>
```

#### Get Current Organization Package
```http
GET /organizations/me/package
Authorization: Bearer <token>
```

#### Upgrade Package
```http
PUT /organizations/me/package
Authorization: Bearer <token>
Content-Type: application/json

{
  "package_id": 2
}
```

#### Purchase Feature
```http
POST /organizations/me/features
Authorization: Bearer <token>
Content-Type: application/json

{
  "feature_id": 1
}
```

#### Remove Feature
```http
DELETE /organizations/me/features/:id
Authorization: Bearer <token>
```

#### Configure Auto-Renewal
```http
PUT /organizations/me/package/auto-renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "credentials": {
    "payment_method": "stripe",
    "stripe_card_token": "..."
  }
}
```

#### Calculate Upgrade Price
```http
POST /organizations/me/package/calculate-upgrade-price
Authorization: Bearer <token>
Content-Type: application/json

{
  "package_id": 3,
  "period": "1_year",
  "custom_months": 12
}
```

### Payments (`/payments`)

#### Create Payment
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "gateway": "stripe",
  "payment_type": "package_upgrade",
  "amount": 100.00,
  "description": "Upgrade to Platinum",
  "package_id": 3,
  "period": "1_year"
}
```

**Response**: Returns payment form data or redirect URL

#### Verify Payment
```http
POST /payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_id": "uuid",
  "transaction_id": "txn_xxx"
}
```

#### Get Payment by ID
```http
GET /payments/:id
Authorization: Bearer <token>
```

#### List Payments
```http
GET /payments?page=1&limit=10
Authorization: Bearer <token>
```

### Chat (`/chats`)

#### Create Chat
```http
POST /chats
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "direct",
  "member_ids": ["user_uuid"]
}
```

**Group Chat**:
```json
{
  "type": "group",
  "name": "Team Chat",
  "description": "Team discussion",
  "member_ids": ["user1_uuid", "user2_uuid"]
}
```

#### List Chats
```http
GET /chats?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Chat by ID
```http
GET /chats/:id
Authorization: Bearer <token>
```

#### Update Chat
```http
PUT /chats/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Chat
```http
DELETE /chats/:id
Authorization: Bearer <token>
```

#### Add Member to Chat
```http
POST /chats/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "member_ids": ["user_uuid"]
}
```

#### Remove Member from Chat
```http
DELETE /chats/:id/members/:memberId
Authorization: Bearer <token>
```

#### Leave Chat
```http
POST /chats/:id/leave
Authorization: Bearer <token>
```

#### Send Message
```http
POST /chats/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello!",
  "message_type": "TEXT"
}
```

#### Get Messages
```http
GET /chats/:id/messages?page=1&limit=50
Authorization: Bearer <token>
```

#### Delete Message
```http
DELETE /chats/:id/messages/:messageId
Authorization: Bearer <token>
```

### Calls (`/calls`)

#### Start Call
```http
POST /calls/chats/:chatId
Authorization: Bearer <token>
Content-Type: application/json

{
  "call_type": "video"
}
```

#### Get Active Call
```http
GET /calls/chats/:chatId/active
Authorization: Bearer <token>
```

#### Join Call
```http
POST /calls/:id/join
Authorization: Bearer <token>
```

#### Leave Call
```http
POST /calls/:id/leave
Authorization: Bearer <token>
```

#### End Call
```http
POST /calls/:id/end
Authorization: Bearer <token>
```

#### Update Media Settings
```http
PUT /calls/:id/media
Authorization: Bearer <token>
Content-Type: application/json

{
  "audio_enabled": true,
  "video_enabled": false
}
```

### Notifications (`/notifications`)

#### List Notifications
```http
GET /notifications?page=1&limit=20&unread_only=false
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

#### Get Notification Preferences
```http
GET /notifications/preferences
Authorization: Bearer <token>
```

#### Get Notification by ID
```http
GET /notifications/:id
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

#### Update Preferences
```http
PUT /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_enabled": true,
  "in_app_enabled": true,
  "preferences": {
    "user_invitations": { "email": true, "in_app": true }
  }
}
```

### MFA (`/mfa`)

#### Check MFA Status
```http
GET /mfa/check
Authorization: Bearer <token>
```

#### Initialize MFA Setup
```http
POST /mfa/setup/initialize
Authorization: Bearer <token>
```

**Response**: Returns QR code data and secret

#### Verify MFA Setup
```http
POST /mfa/setup/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

#### Get Backup Codes
```http
GET /mfa/backup-codes
Authorization: Bearer <token>
```

#### Regenerate Backup Codes
```http
POST /mfa/backup-codes/regenerate
Authorization: Bearer <token>
```

#### Disable MFA
```http
DELETE /mfa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

### Invitations (`/invitations`)

#### Create Invitation
```http
POST /invitations
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role_id": 2
}
```

#### List Invitations
```http
GET /invitations?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Invitation by Token
```http
GET /invitations/token/:token
```

#### Accept Invitation
```http
POST /invitations/accept/:token
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Doe",
  "password": "SecurePassword123!"
}
```

#### Delete Invitation
```http
DELETE /invitations/:id
Authorization: Bearer <token>
```

### Audit Logs (`/audit-logs`)

#### List Audit Logs
```http
GET /audit-logs?page=1&limit=20&action=user.created
Authorization: Bearer <token>
```

#### Get Audit Log Statistics
```http
GET /audit-logs/stats
Authorization: Bearer <token>
```

#### Get Viewable Users
```http
GET /audit-logs/viewable-users
Authorization: Bearer <token>
```

#### Get Audit Log by ID
```http
GET /audit-logs/:id
Authorization: Bearer <token>
```

### Documents (`/organizations/me/documents`)

#### List Documents
```http
GET /organizations/me/documents?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Document by ID
```http
GET /organizations/me/documents/:id
Authorization: Bearer <token>
```

#### Download Document
```http
GET /organizations/me/documents/:id/download
Authorization: Bearer <token>
```

#### Upload Document
```http
POST /organizations/me/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <file>,
  "title": "Document Title",
  "description": "Document description"
}
```

#### Delete Document
```http
DELETE /organizations/me/documents/:id
Authorization: Bearer <token>
```

## WebSocket Events

### Connection
```javascript
socket.connect('ws://localhost:3000', {
  query: {
    organizationId: 'org_uuid',
    token: 'jwt_token'
  }
});
```

### Events

#### Client → Server

- `message:send`: Send message
- `call:offer`: Initiate call
- `call:answer`: Answer call
- `call:ice-candidate`: ICE candidate
- `call:end`: End call
- `call:reject`: Reject call

#### Server → Client

- `message:new`: New message received
- `message:updated`: Message updated
- `message:deleted`: Message deleted
- `call:incoming`: Incoming call
- `call:answered`: Call answered
- `call:ended`: Call ended
- `notification:new`: New notification

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit**: 10 requests per minute
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

All list endpoints support pagination:

```
GET /endpoint?page=1&limit=20
```

**Response**:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

## Interactive Documentation

Swagger UI is available at:
```
http://localhost:3000/api/docs
```

