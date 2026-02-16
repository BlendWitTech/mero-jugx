const fs = require('fs');
const path = require('path');

function findAndCreateEnv(dir) {
    // Skip node_modules and .git
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) {
        return;
    }

    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        return;
    }

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findAndCreateEnv(fullPath);
        } else if (file.endsWith('.env.example')) {
            const envPath = path.join(dir, '.env');
            if (!fs.existsSync(envPath)) {
                console.log(`Creating .env from ${file} in ${dir}`);
                fs.copyFileSync(fullPath, envPath);
            }
            // Check for other variants like .env.local.example? No, usually just .env
        }
    });
}

console.log('Scanning for .env.example files...');
findAndCreateEnv(path.join(__dirname, '..'));
console.log('Environment file generation complete.');
