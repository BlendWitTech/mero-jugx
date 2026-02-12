
import { AppDataSource } from './api/src/database/migrations/DataSource';

async function check() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  const columns = await queryRunner.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'organizations'
  `);
  console.log('Columns in organizations table:', columns);
  await AppDataSource.destroy();
}

check().catch(console.error);
