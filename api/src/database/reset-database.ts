import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { AppDataSource } from './migrations/DataSource';
import { seedPackages } from './seeds/001-packages.seed';
import { seedPermissions } from './seeds/002-permissions.seed';
import { seedRoles } from './seeds/003-roles.seed';
import { seedPackageFeatures } from './seeds/004-package-features.seed';
import { seedRoleTemplates } from './seeds/005-role-templates.seed';
import { seedSystemAdminUser } from './seeds/006-system-admin-user.seed';
import { seedWorkspaceProjectTemplates } from '../../marketplace/shared/mero-board/seeds/workspace-project-templates.seed';
import { seedNepalChartOfAccounts } from './seeds/007-nepal-chart-of-accounts.seed';

// Load environment variables
config();

/**
 * Reset database - completely drops and recreates everything
 * 
 * This function:
 * 1. Drops all existing tables and types
 * 2. Clears the migrations table
 * 3. Runs all migrations to recreate all tables fresh
 * 4. Seeds all initial data (packages, permissions, roles, package features, role templates)
 * 
 * Used by: npm run db:reset, reset scripts
 */
async function resetDatabase() {
  try {
    console.log('📦 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '5433'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'mero_jugx'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log('');

    await AppDataSource.initialize();
    console.log('✅ Database connected.\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // Get all table names
    console.log('🗑️  Dropping all tables...');
    const tables = await queryRunner.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'migrations'
    `);

    if (tables.length > 0) {
      // Drop all foreign key constraints first
      const fkConstraints = await queryRunner.query(`
        SELECT 
          'ALTER TABLE "' || table_name || '" DROP CONSTRAINT "' || constraint_name || '"' as drop_command
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
      `);

      for (const constraint of fkConstraints) {
        try {
          await queryRunner.query(constraint.drop_command);
        } catch (error: any) {
          // Ignore errors for constraints that don't exist
        }
      }

      // Drop all tables
      for (const table of tables) {
        try {
          await queryRunner.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
          console.log(`  ✓ Dropped table: ${table.tablename}`);
        } catch (error: any) {
          console.log(`  ⚠ Could not drop table ${table.tablename}: ${error?.message || error}`);
        }
      }

      // Drop all custom types (enums)
      const enums = await queryRunner.query(`
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `);

      for (const enumType of enums) {
        try {
          await queryRunner.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE`);
          console.log(`  ✓ Dropped type: ${enumType.typname}`);
        } catch (error: any) {
          console.log(`  ⚠ Could not drop type ${enumType.typname}: ${error?.message || error}`);
        }
      }
    } else {
      console.log('  ℹ No tables to drop.');
    }

    // Clear migrations table (if it exists)
    console.log('\n🗑️  Clearing migrations table...');
    try {
      await queryRunner.query('TRUNCATE TABLE migrations');
      console.log('  ✓ Migrations table cleared.');
    } catch (error: any) {
      // Migrations table might not exist, that's okay
      console.log('  ℹ Migrations table does not exist or is already empty.');
    }

    await queryRunner.release();

    // Run migrations to recreate tables
    console.log('\n📋 Running migrations to recreate database structure...');
    const migrations = await AppDataSource.runMigrations();
    if (migrations.length > 0) {
      migrations.forEach((migration) => {
        console.log(`  ✓ Applied migration: ${migration.name}`);
      });
    } else {
      console.log('  ℹ No migrations to run.');
    }
    console.log('  ✓ Migrations completed.');

    // Run seeds
    console.log('\n🌱 Running seed data...');
    await seedPackages(AppDataSource);
    await seedPermissions(AppDataSource);
    await seedRoles(AppDataSource);
    await seedPackageFeatures(AppDataSource);
    await seedRoleTemplates(AppDataSource);
    await seedSystemAdminUser(AppDataSource);
    await seedWorkspaceProjectTemplates(AppDataSource); // Note: Ensure proper import path if outside 'database/seeds'
    await seedNepalChartOfAccounts(AppDataSource);

    console.log('  ✓ Seeds completed.');

    console.log('\n✅ Database reset completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Error resetting database:', error?.message || error);

    // Provide helpful error messages for common issues
    if (error?.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Refused - Possible issues:');
      console.error('   1. PostgreSQL is not running');
      console.error('   2. Wrong port number (check DB_PORT in .env)');
      console.error('   3. Docker containers not started (run: docker-compose up -d)');
      console.error(
        `   4. Trying to connect to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5433'}`,
      );
    } else if (error?.code === 'ENOTFOUND') {
      console.error('\n💡 Host Not Found - Check DB_HOST in .env file');
    } else if (error?.code === '28P01' || error?.message?.includes('password')) {
      console.error('\n💡 Authentication Failed - Check DB_USER and DB_PASSWORD in .env file');
    } else if (error?.code === '3D000' || error?.message?.includes('does not exist')) {
      console.error('\n💡 Database Not Found - Create the database first:');
      console.error('   CREATE DATABASE mero_jugx;');
    }

    console.error('');
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

resetDatabase();
