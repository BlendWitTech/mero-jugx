const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Bootstrap: Install dependencies if inquirer is missing
try {
    require.resolve('inquirer');
} catch (e) {
    console.log('Installing setup dependencies...');
    // Install in the root where package.json is
    spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        shell: true
    });
}

const isWindows = process.platform === 'win32';

async function main() {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', 'Mero Jugx - Interactive Start CLI');
    console.log('===================================');

    const { default: inquirer } = await import('inquirer');

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'env',
            message: 'Which environment would you like to start?',
            choices: [
                { name: 'Development (Local)', value: 'dev' },
                { name: 'Production', value: 'prod' },
                { name: 'Testing', value: 'test' },
            ],
        },
        {
            type: 'list',
            name: 'mode',
            message: 'What would you like to run?',
            choices: [
                { name: 'Full Stack (Backend + Frontend + DB + Redis)', value: 'all' },
                { name: 'Backend Only', value: 'backend' },
                { name: 'Frontend Only', value: 'frontend' },
                { name: 'Microservices', value: 'ms' },
                { name: 'Database Only', value: 'db' },
            ],
            when: (answers) => answers.env !== 'prod', // Prod usually runs everything
        },
        {
            type: 'checkbox',
            name: 'services',
            message: 'Select services to run:',
            choices: [
                { name: 'System Admin', value: 'system-admin' },
                { name: 'CRM (Internal)', value: 'crm' },
            ],
            when: (answers) => answers.mode === 'ms',
        },
    ]);

    let scriptName = '';
    let args = [];

    if (answers.env === 'prod') {
        scriptName = 'start-prod';
    } else if (answers.env === 'test') {
        scriptName = 'start-test';
    } else {
        // Development
        switch (answers.mode) {
            case 'all':
                scriptName = 'start-dev';
                break;
            case 'backend':
                scriptName = 'run-backend';
                break;
            case 'frontend':
                scriptName = 'run-frontend';
                break;
            case 'db':
                scriptName = 'db-manager';
                args = ['start'];
                break;
            case 'ms':
                scriptName = 'run-ms';
                args = answers.services;
                break;
        }
    }

    if (!scriptName) {
        console.error('Invalid selection.');
        process.exit(1);
    }

    runScript(scriptName, args);
}

function runScript(scriptName, args = []) {
    const scriptsDir = __dirname;
    let command = '';
    let shellArgs = [];

    if (isWindows) {
        const scriptPath = path.join(scriptsDir, `${scriptName}.ps1`);
        if (!fs.existsSync(scriptPath)) {
            console.error(`Script not found: ${scriptPath}`);
            return;
        }
        command = 'powershell';
        shellArgs = ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', scriptPath, ...args];
    } else {
        const scriptPath = path.join(scriptsDir, `${scriptName}.sh`);
        if (!fs.existsSync(scriptPath)) {
            console.error(`Script not found: ${scriptPath}`);
            return;
        }
        command = 'bash';
        shellArgs = [scriptPath, ...args];
    }

    console.log(`\n> Running: ${scriptName} ${args.join(' ')}\n`);

    const child = spawn(command, shellArgs, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: process.env
    });

    child.on('error', (err) => {
        console.error(`Failed to start script: ${err.message}`);
    });
}

main();
