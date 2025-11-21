import { DataSource } from 'typeorm';

export async function createTestDataSource(): Promise<DataSource> {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_TEST_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_TEST_PORT || process.env.DB_PORT || '5433', 10),
    username: process.env.DB_TEST_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_TEST_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_TEST_DATABASE || 'mero_jugx_test',
    entities: ['src/database/entities/**/*.entity.ts'],
    synchronize: true, // For testing only
    dropSchema: true, // Clean database before each test
  });
}

export async function closeTestDataSource(dataSource: DataSource): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

