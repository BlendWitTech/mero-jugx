# Database Migration Auto-Sync Guide

This document explains how to ensure database migrations stay automatically synchronized with entity changes.

## Quick Start

### Before Making Entity Changes

1. **Update the entity file** with your changes
2. **Run validation:**
   ```bash
   npm run migration:validate
   ```
3. **If adding enum values**, update the initial migration (`1763103799252-InitialMigration.ts`)
4. **If modifying tables/columns**, generate a new migration:
   ```bash
   npm run migration:generate -- src/database/migrations/YourMigrationName
   ```
5. **Test the changes:**
   ```bash
   npm run db:reset
   ```

## Automatic Validation

The `migration:validate` script automatically checks:
- ✅ Enum values in migrations match entity definitions
- ✅ No missing enum values
- ✅ No extra enum values in database

### Running Validation

```bash
npm run migration:validate
```

This will:
- Connect to the database
- Check all enum types against entity definitions
- Report any mismatches
- Exit with error code if issues found

## Workflow for Adding New Enum Values

### Step 1: Update Entity
```typescript
// src/database/entities/my-entity.entity.ts
export enum MyEnum {
  VALUE1 = 'value1',
  VALUE2 = 'value2',
  NEW_VALUE = 'new_value', // ← Add new value here
}
```

### Step 2: Update Initial Migration
```typescript
// src/database/migrations/1763103799252-InitialMigration.ts
await queryRunner.query(
  `CREATE TYPE "public"."my_enum" AS ENUM('value1', 'value2', 'new_value')`
);
```

### Step 3: Update Validation Script
```typescript
// src/database/validate-migrations.ts
import { MyEnum } from './entities/my-entity.entity';

const EXPECTED_ENUMS: EnumDefinition[] = [
  // ... existing enums
  {
    name: 'my_enum',
    values: Object.values(MyEnum), // ← Automatically includes new value
    entityFile: 'my-entity.entity.ts',
  },
];
```

### Step 4: Validate
```bash
npm run migration:validate
npm run db:reset
```

## Workflow for Modifying Tables/Columns

### Step 1: Update Entity
```typescript
// Add/modify columns in entity file
@Column({ type: 'varchar', length: 255 })
new_field: string;
```

### Step 2: Generate Migration
```bash
npm run migration:generate -- src/database/migrations/AddNewFieldToTable
```

### Step 3: Review Generated Migration
Check the generated migration file and adjust if needed.

### Step 4: Test
```bash
npm run db:reset
npm run migration:validate
```

## Important Rules

### ✅ DO:
- Always update the **initial migration** when adding enum values
- Run `migration:validate` before committing
- Test with `db:reset` after changes
- Keep enum values in sync between entities and migrations

### ❌ DON'T:
- Create separate migrations to add enum values (unless DB is in production)
- Modify enum values without updating migrations
- Skip validation before committing
- Add enum values that don't exist in entity definitions

## Troubleshooting

### Error: "type does not exist"
**Problem:** Migration tries to modify enum before it's created.

**Solution:** Ensure enum is created in initial migration with all values.

### Error: "invalid input value for enum"
**Problem:** Code uses enum value that doesn't exist in database.

**Solution:** 
1. Add missing value to initial migration
2. Run migrations: `npm run migration:run`
3. Or reset: `npm run db:reset`

### Validation Fails
**Problem:** Enum values don't match between entity and migration.

**Solution:**
1. Check entity file for correct enum values
2. Update initial migration to match
3. Run `npm run db:reset` to test

## CI/CD Integration

Add validation to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Migrations
  run: npm run migration:validate
```

This ensures migrations stay in sync before merging.

## Migration Commands Reference

| Command | Description |
|---------|-------------|
| `npm run migration:validate` | Validate migrations against entities |
| `npm run migration:generate` | Generate new migration from entity changes |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
| `npm run db:reset` | Drop all and recreate from migrations |

## Current Enum Types

All enum types are automatically validated. See `src/database/validate-migrations.ts` for the complete list.

## Need Help?

1. Check `docs/MIGRATION-GUIDE.md` for detailed migration guide
2. Run `npm run migration:validate` to see what's wrong
3. Check entity files to ensure enum values match migrations

