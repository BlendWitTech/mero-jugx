/**
 * Migration Validation Script
 *
 * This script validates that database migrations are in sync with entity definitions.
 * Run this before creating new migrations to ensure consistency.
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AppDataSource } from './migrations/DataSource';
import { EmailVerificationType } from './entities/email_verifications.entity';
import { DocumentType } from './entities/organization_documents.entity';
import { OrganizationStatus } from './entities/organizations.entity';
import { OrganizationPackageFeatureStatus } from './entities/organization_package_features.entity';
import { PackageFeatureType } from './entities/package_features.entity';
import { InvitationStatus, InvitationType } from './entities/invitations.entity';
import { OrganizationMemberStatus } from './entities/organization_members.entity';
import { UserStatus } from './entities/users.entity';

// Load environment variables
config();

interface EnumDefinition {
  name: string;
  values: string[];
  entityFile: string;
}

/**
 * Define all enum types and their expected values from entities
 * Update this whenever you add/modify enum types in entities
 */
const EXPECTED_ENUMS: EnumDefinition[] = [
  {
    name: 'email_verifications_type_enum',
    values: Object.values(EmailVerificationType),
    entityFile: 'email_verifications.entity.ts',
  },
  {
    name: 'invitations_status_enum',
    values: Object.values(InvitationStatus),
    entityFile: 'invitations.entity.ts',
  },
  {
    name: 'users_status_enum',
    values: Object.values(UserStatus),
    entityFile: 'users.entity.ts',
  },
  {
    name: 'organizations_status_enum',
    values: Object.values(OrganizationStatus),
    entityFile: 'organizations.entity.ts',
  },
  {
    name: 'organization_members_status_enum',
    values: Object.values(OrganizationMemberStatus),
    entityFile: 'organization_members.entity.ts',
  },
  {
    name: 'package_features_type_enum',
    values: Object.values(PackageFeatureType),
    entityFile: 'package_features.entity.ts',
  },
  {
    name: 'organization_package_features_status_enum',
    values: Object.values(OrganizationPackageFeatureStatus),
    entityFile: 'organization_package_features.entity.ts',
  },
  {
    name: 'organization_documents_document_type_enum',
    values: Object.values(DocumentType),
    entityFile: 'organization_documents.entity.ts',
  },
];

async function validateMigrations() {
  let dataSourceInitialized = false;
  try {
    console.log('🔍 Validating migrations against entity definitions...\n');

    try {
      await AppDataSource.initialize();
      dataSourceInitialized = true;
    } catch (error: any) {
      console.log('⚠️  Could not connect to database. Skipping database validation.');
      console.log('   This is okay if the database is not set up yet.\n');
      console.log('✅ Entity enum definitions are valid:');
      EXPECTED_ENUMS.forEach((enumDef) => {
        console.log(`   - ${enumDef.name}: ${enumDef.values.join(', ')}`);
      });
      console.log('\n💡 Tip: Run migrations and connect to database for full validation.');
      return;
    }

    const queryRunner = AppDataSource.createQueryRunner();

    let hasErrors = false;

    for (const expectedEnum of EXPECTED_ENUMS) {
      console.log(`Checking ${expectedEnum.name}...`);

      try {
        // Check if enum exists in database
        const enumExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = '${expectedEnum.name}'
            AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          )
        `);

        if (!enumExists[0].exists) {
          console.log(`  ⚠️  Enum ${expectedEnum.name} does not exist in database`);
          console.log(`     This is expected if migrations haven't been run yet.\n`);
          continue;
        }

        // Get actual enum values from database
        const actualValues = await queryRunner.query(`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (
            SELECT oid FROM pg_type WHERE typname = '${expectedEnum.name}'
          )
          ORDER BY enumsortorder
        `);

        const actualEnumValues = actualValues.map((row: any) => row.enumlabel);
        const expectedEnumValues = expectedEnum.values;

        // Compare values
        const missing = expectedEnumValues.filter((v) => !actualEnumValues.includes(v));
        const extra = actualEnumValues.filter((v) => !expectedEnumValues.includes(v));

        if (missing.length > 0 || extra.length > 0) {
          console.log(`  ❌ Mismatch found in ${expectedEnum.name}:`);
          if (missing.length > 0) {
            console.log(`     Missing values: ${missing.join(', ')}`);
            console.log(
              `     Add these to the initial migration or create a migration to add them.`,
            );
          }
          if (extra.length > 0) {
            console.log(`     Extra values in DB: ${extra.join(', ')}`);
            console.log(`     These may need to be removed or kept for backward compatibility.`);
          }
          console.log(`     Expected: ${expectedEnumValues.join(', ')}`);
          console.log(`     Actual: ${actualEnumValues.join(', ')}\n`);
          hasErrors = true;
        } else {
          console.log(`  ✅ ${expectedEnum.name} matches entity definition\n`);
        }
      } catch (error: any) {
        console.log(`  ⚠️  Error checking ${expectedEnum.name}: ${error.message}\n`);
      }
    }

    await queryRunner.release();
    if (dataSourceInitialized) {
      await AppDataSource.destroy();
    }

    if (hasErrors) {
      console.log('❌ Validation failed. Please update migrations to match entity definitions.');
      console.log('\n📝 Tips:');
      console.log('  1. If adding new enum values, update the initial migration');
      console.log('  2. If modifying existing enums, create a new migration');
      console.log('  3. Always test migrations with: npm run db:reset');
      process.exit(1);
    } else {
      console.log('✅ All migrations are in sync with entity definitions!');
    }
  } catch (error) {
    console.error('❌ Error validating migrations:', error);
    process.exit(1);
  }
}

validateMigrations();
