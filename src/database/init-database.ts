import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { AppDataSource } from './migrations/DataSource';
import { seedPackages } from './seeds/001-packages.seed';
import { seedPermissions } from './seeds/002-permissions.seed';
import { seedRoles } from './seeds/003-roles.seed';
import { seedPackageFeatures } from './seeds/004-package-features.seed';
import { seedRoleTemplates } from './seeds/005-role-templates.seed';

// Load environment variables
config();

/**
 * Initialize database - runs migrations and seeds if needed
 * 
 * This function:
 * 1. Creates all database tables by running migrations
 * 2. Seeds initial data (packages, permissions, roles, package features, role templates)
 * 
 * This is safe to run on every startup as it checks if migrations/seeds are already applied.
 * Used by: npm run db:init, setup scripts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected.\n');

    // Check if migrations table exists
    const queryRunner = AppDataSource.createQueryRunner();
    const migrationsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    // Always run migrations - this is safe as it only runs pending migrations
    // TypeORM's runMigrations() automatically skips already-executed migrations
    console.log('📋 Running migrations...');
    
    try {
      const migrations = await AppDataSource.runMigrations();
      if (migrations.length > 0) {
        console.log(`  ✓ Applied ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          console.log(`    - ${migration.name}`);
        });
        console.log('  ✓ Migrations completed.\n');
      } else {
        console.log('  ✓ All migrations are up to date.\n');
      }
    } catch (error: any) {
      // If migrations fail, provide helpful error message
      console.error('  ❌ Error running migrations:', error?.message || error);
      if (error?.message?.includes('already exists')) {
        console.log('  ℹ Some migrations may have been partially applied. Continuing...\n');
      } else {
        throw error;
      }
    }

    // Check if seeds need to be run (check if packages table has data)
    let hasPackages = false;
    try {
      const packagesCount = await queryRunner.query('SELECT COUNT(*) as count FROM packages');
      hasPackages = parseInt(packagesCount[0]?.count || '0', 10) > 0;
    } catch (error: any) {
      // Packages table might not exist yet, that's okay
      if (!error?.message?.includes('does not exist')) {
        throw error;
      }
    }

    if (!hasPackages) {
      console.log('🌱 Running seed data (first time setup)...');
      await seedPackages(AppDataSource);
      await seedPermissions(AppDataSource);
      await seedRoles(AppDataSource);
      await seedPackageFeatures(AppDataSource);
      await seedRoleTemplates(AppDataSource);
      console.log('  ✓ Seeds completed.\n');
    } else {
      // Check if admin role has all required permissions (ensure existing roles are updated)
      try {
        const adminRole = await queryRunner.query(
          "SELECT id FROM roles WHERE slug = 'admin' AND is_system_role = true LIMIT 1"
        );
        
        if (adminRole.length > 0) {
          const adminRoleId = adminRole[0].id;
          const usersViewPermission = await queryRunner.query(
            "SELECT id FROM permissions WHERE slug = 'users.view' LIMIT 1"
          );
          
          if (usersViewPermission.length > 0) {
            const permissionId = usersViewPermission[0].id;
            const hasPermission = await queryRunner.query(
              `SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1`,
              [adminRoleId, permissionId]
            );
            
            if (hasPermission.length === 0) {
              console.log('🔧 Updating admin role permissions...');
              await queryRunner.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [adminRoleId, permissionId]
              );
              console.log('  ✓ Admin role updated with users.view permission.\n');
            }
          }
        }
      } catch (error: any) {
        // If updating permissions fails, log but don't fail the whole initialization
        console.log('  ⚠ Could not update admin permissions (this is okay if already up to date)');
      }
      
      console.log('✓ Database is already initialized with seed data.\n');
    }

    await queryRunner.release();
    console.log('✅ Database initialization complete!');
  } catch (error: any) {
    console.error('❌ Error initializing database:', error?.message || error);
    
    // Provide helpful error messages
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
    
    throw error;
  }
}

/**
 * Check if database is initialized (has migrations and seed data)
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Check if migrations table exists
    const migrationsTableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationsTableExists[0]?.exists) {
      await queryRunner.release();
      return false;
    }

    // Check if packages table has data
    const packagesCount = await queryRunner.query('SELECT COUNT(*) as count FROM packages');
    const hasPackages = parseInt(packagesCount[0]?.count || '0', 10) > 0;

    await queryRunner.release();
    return hasPackages;
  } catch (error) {
    return false;
  }
}

