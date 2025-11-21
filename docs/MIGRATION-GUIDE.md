# Database Migration Guide

This guide ensures database migrations stay in sync with entity changes.

## Best Practices

### 1. When Adding New Enum Values

**DO:**
- Update the **initial migration** (`1763103799252-InitialMigration.ts`) to include all enum values
- This ensures `npm run db:reset` works correctly

**DON'T:**
- Create separate migrations to add enum values to existing enums (unless the database is already in production)
- Add enum values that don't exist in the entity definition

### 2. When Modifying Entities

**Before creating a migration:**
1. Update the entity file first
2. Run `npm run migration:validate` to check consistency
3. If adding enum values, update the initial migration
4. If modifying columns/tables, generate a new migration

### 3. Migration Validation

Run validation before committing:
```bash
npm run migration:validate
```

This checks:
- Enum values in migrations match entity definitions
- No missing enum values
- No extra enum values

### 4. Database Reset

Always test migrations with:
```bash
npm run db:reset
```

This ensures:
- Migrations run in correct order
- Enums are created with all values
- No dependency issues

## Current Enum Types

### `email_verifications_type_enum`
- Values: `registration`, `invitation`, `email_change`, `organization_email`
- Entity: `src/database/entities/email-verification.entity.ts`
- Migration: `1763103799252-InitialMigration.ts` (line 54)

### `invitations_status_enum`
- Values: `pending`, `accepted`, `expired`, `cancelled`
- Migration: `1763103799252-InitialMigration.ts` (line 20)

### `users_status_enum`
- Values: `active`, `suspended`, `deleted`
- Migration: `1763103799252-InitialMigration.ts` (line 70)

### `organizations_status_enum`
- Values: `active`, `suspended`, `deleted`
- Migration: `1763103799252-InitialMigration.ts` (line 37)

### `organization_members_status_enum`
- Values: `active`, `revoked`, `left`
- Migration: `1763103799252-InitialMigration.ts` (line 43)

### `package_features_type_enum`
- Values: `user_upgrade`, `role_upgrade`
- Migration: `1763103799252-InitialMigration.ts` (line 28)

### `organization_package_features_status_enum`
- Values: `active`, `cancelled`
- Migration: `1763103799252-InitialMigration.ts` (line 32)

### `organization_documents_document_type_enum`
- Values: `contract`, `license`, `certificate`, `invoice`, `other`
- Migration: `1763103799253-AddRoleTemplatesAndDocuments.ts` (line 69)

## Adding New Enum Types

1. **Define enum in entity:**
   ```typescript
   export enum MyNewEnum {
     VALUE1 = 'value1',
     VALUE2 = 'value2',
   }
   ```

2. **Update initial migration:**
   ```typescript
   await queryRunner.query(
     `CREATE TYPE "public"."my_new_enum" AS ENUM('value1', 'value2')`
   );
   ```

3. **Add to validation script:**
   Update `src/database/validate-migrations.ts` with the new enum definition

4. **Test:**
   ```bash
   npm run db:reset
   npm run migration:validate
   ```

## Troubleshooting

### Error: "type does not exist"
- **Cause:** Migration tries to modify enum before it's created
- **Fix:** Ensure enum is created in initial migration with all values

### Error: "invalid input value for enum"
- **Cause:** Code uses enum value that doesn't exist in database
- **Fix:** Add missing value to initial migration and run migrations

### Error: Migration fails during reset
- **Cause:** Migration order or dependencies are incorrect
- **Fix:** Check migration timestamps and ensure dependencies are created first

## Migration Commands

```bash
# Validate migrations
npm run migration:validate

# Generate new migration (after entity changes)
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Reset database (drops all and recreates)
npm run db:reset

# Show migration status
npm run migration:show
```

## Checklist Before Committing

- [ ] Entity changes are reflected in migrations
- [ ] Enum values match between entities and migrations
- [ ] `npm run migration:validate` passes
- [ ] `npm run db:reset` completes successfully
- [ ] All tests pass

