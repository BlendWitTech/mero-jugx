import { initializeDatabase, isDatabaseInitialized } from './init-database';

// CLI entry point for database initialization
const command = process.argv[2];

if (command === 'check') {
  isDatabaseInitialized()
    .then((initialized) => {
      if (initialized) {
        console.log('✅ Database is initialized');
        process.exit(0);
      } else {
        console.log('❌ Database needs initialization');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error checking database:', error);
      process.exit(1);
    });
} else {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

