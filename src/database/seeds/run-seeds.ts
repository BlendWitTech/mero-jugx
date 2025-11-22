import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';
import { seedPackages } from './001-packages.seed';
import { seedPermissions } from './002-permissions.seed';
import { seedRoles } from './003-roles.seed';
import { seedPackageFeatures } from './004-package-features.seed';
import { seedRoleTemplates } from './005-role-templates.seed';

// Load environment variables
config();

async function runSeeds() {
  const configService = new ConfigService();

  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5433),
    username: configService.get<string>('DB_USER', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'mero_jugx'),
    entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected. Starting seed process...\n');

    // Run seeds in order
    await seedPackages(dataSource);
    console.log('');

    await seedPermissions(dataSource);
    console.log('');

    await seedRoles(dataSource);
    console.log('');

    await seedPackageFeatures(dataSource);
    console.log('');

    await seedRoleTemplates(dataSource);
    console.log('');

    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
