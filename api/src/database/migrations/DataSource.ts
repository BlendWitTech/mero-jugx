import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mero_jugx',
  entities: [
    path.join(__dirname, '../entities/**/*.entity{.ts,.js}'),
    path.join(__dirname, '../../../apps/marketplace/shared/mero-board/backend/entities/**/*.entity{.ts,.js}'),
  ],
  migrations: [path.join(__dirname, '[0-9]*-*.ts')],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});
