# Multi-Tenancy Isolation Tests

This document describes the multi-tenancy isolation tests in `multi-tenancy-isolation.e2e-spec.ts`.

## Overview

These tests verify that the platform properly isolates data between organizations, ensuring that:
1. Users can only access data from their organization
2. Cross-organization access is prevented
3. Organization context is properly extracted from JWT tokens
4. Queries properly filter by `organization_id`

## Test Structure

### Setup

The tests create two separate organizations:
- **Organization 1** (org1): `org1owner@test.com`
- **Organization 2** (org2): `org2owner@test.com`

Each organization has its own authentication token and user.

### Test Categories

#### 1. Organization Context Extraction
- Verifies that organization ID is correctly extracted from JWT tokens
- Tests that different tokens return different organizations

#### 2. User Data Isolation
- Verifies that user lists only contain users from the requesting organization
- Ensures no overlap between organization user lists

#### 3. Ticket Data Isolation
- Creates tickets in both organizations
- Verifies that each organization only sees its own tickets
- Tests that cross-organization ticket access is prevented (returns 404)
- Tests that ticket updates are prevented for other organizations

#### 4. Chat Data Isolation
- Creates chats in both organizations
- Verifies that each organization only sees its own chats
- Tests that cross-organization chat access is prevented

#### 5. Query Filtering by Organization
- Verifies that queries properly filter by `organization_id`
- Tests that all returned resources belong to the requesting organization

#### 6. Same User in Different Organizations
- Tests that users can access different organizations separately
- Verifies organization context switching

#### 7. Error Handling
- Tests authentication requirements
- Tests that cross-organization access returns 404 (not 403) to avoid information leakage

## Running the Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run only multi-tenancy isolation tests
npm run test:e2e -- multi-tenancy-isolation.e2e-spec.ts
```

## Test Requirements

### Environment Setup

The tests require:
- PostgreSQL database (configured in `.env`)
- Redis (for sessions)
- Test database should be separate from development database

### Environment Variables

```env
DB_TEST_HOST=localhost
DB_TEST_PORT=5432
DB_TEST_USERNAME=postgres
DB_TEST_PASSWORD=postgres
DB_TEST_DATABASE=mero_jugx_test
```

### Feature Access Requirements

Some tests (Ticket and Chat isolation) require organizations to have access to these features:
- **Ticket System**: Requires Platinum/Diamond package or separate feature purchase
- **Chat System**: Requires Platinum/Diamond package or separate feature purchase

If organizations don't have access, those specific tests will be skipped automatically. The core isolation tests (Organization Context, User Data Isolation) will still run.

To enable full test coverage, ensure test organizations are created with packages that include these features, or purchase the features separately.

## Test Coverage

The tests cover:
- ✅ Organization context extraction
- ✅ User data isolation
- ✅ Ticket CRUD operations with isolation
- ✅ Chat CRUD operations with isolation
- ✅ Query filtering by organization
- ✅ Cross-organization access prevention
- ✅ Error handling (404 vs 403)
- ✅ Authentication requirements

## Expected Behavior

### Successful Isolation

- Each organization only sees its own data
- Attempts to access other organizations' data return 404
- All queries filter by `organization_id`
- Organization context comes from JWT token

### Security Principles

1. **404 Not 403**: Cross-organization access returns 404 to avoid information leakage
2. **JWT-Based Context**: Organization ID always from JWT, never from request body
3. **Query Filtering**: All queries must filter by `organization_id` first
4. **No Data Leakage**: Error messages don't reveal existence of resources in other organizations

## Adding New Tests

When adding tests for new resources:

1. Create resources in both organizations
2. Verify each organization only sees its own resources
3. Verify cross-organization access returns 404
4. Verify query filtering works correctly
5. Verify all returned resources have correct `organization_id`

Example:

```typescript
describe('NewResource Data Isolation', () => {
  let org1ResourceId: string;
  let org2ResourceId: string;

  beforeAll(async () => {
    // Create resources in both orgs
    org1ResourceId = await createResource(app, org1Token, { ... });
    org2ResourceId = await createResource(app, org2Token, { ... });
  });

  it('should only return resources from requesting organization', async () => {
    const org1Response = await request(app.getHttpServer())
      .get('/api/v1/new-resources')
      .set('Authorization', `Bearer ${org1Token}`)
      .expect(200);

    const org1Resources = org1Response.body.data || org1Response.body;
    const org1ResourceIds = org1Resources.map((r: any) => r.id);

    expect(org1ResourceIds).toContain(org1ResourceId);
    expect(org1ResourceIds).not.toContain(org2ResourceId);
  });

  it('should prevent accessing resource from another organization', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/new-resources/${org2ResourceId}`)
      .set('Authorization', `Bearer ${org1Token}`)
      .expect(404);
  });
});
```

## Troubleshooting

### Tests Fail with Database Connection Errors

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify test database exists: `createdb mero_jugx_test`

### Tests Fail with 401 Unauthorized

- Check that JWT tokens are being generated correctly
- Verify token format in Authorization header
- Check JWT_SECRET is set in `.env`

### Tests Fail with 404 for Own Resources

- Verify organization_id is correctly set in JWT token
- Check that resources are being created with correct organization_id
- Verify service methods filter by organization_id

### Tests Pass but Should Fail

- Review service implementation to ensure organization filtering
- Check controller uses `@CurrentOrganization()` decorator
- Verify queries include `organization_id` filter

---

**Last Updated**: 2024-12-28

