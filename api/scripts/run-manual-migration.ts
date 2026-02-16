import { AppDataSource } from '../src/database/migrations/DataSource';

async function run() {
    console.log('Starting manual migration run...');
    try {
        await AppDataSource.initialize();
        console.log('DataSource initialized successfully.');

        console.log('Running migrations...');
        const migrations = await AppDataSource.runMigrations();
        console.log(`Successfully executed ${migrations.length} migrations.`);
        migrations.forEach(m => console.log(`- ${m.name}`));

        await AppDataSource.destroy();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed with error:');
        console.error(err);
        process.exit(1);
    }
}

run();
