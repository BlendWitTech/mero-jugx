import { AppDataSource } from '../api/src/database/migrations/DataSource';

async function listApps() {
    try {
        await AppDataSource.initialize();
        const apps = await AppDataSource.query('SELECT id, name, slug FROM apps');
        console.log('--- APPS LIST ---');
        console.table(apps);
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error listing apps:', error);
    }
}

listApps();
