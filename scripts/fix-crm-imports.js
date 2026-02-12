/**
 * Script to fix @src imports in mero-crm module
 * Converts @src path aliases to relative imports
 */

const fs = require('fs');
const path = require('path');

const crmSrcDir = path.join(__dirname, '../api/marketplace/organization/mero-crm/src');

// Mapping of @src imports to relative paths from mero-crm/src
const importMappings = {
    "@src/config/": "../../../../src/config/",
    "@src/auth/": "../../../../src/auth/",
    "@src/common/": "../../../../src/common/",
    "@src/users/": "../../../../src/users/",
    "@src/database/entities/": "../../../../src/database/entities/",
    "@src/audit-logs/": "../../../../src/audit-logs/",
};

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const [srcPath, relativePath] of Object.entries(importMappings)) {
        const regex = new RegExp(srcPath.replace(/\//g, '\\/'), 'g');
        if (content.includes(srcPath)) {
            content = content.replace(regex, relativePath);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
        return true;
    }
    return false;
}

function processDirectory(dir) {
    let fixedCount = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            fixedCount += processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            if (fixImportsInFile(fullPath)) {
                fixedCount++;
            }
        }
    }

    return fixedCount;
}

console.log('Fixing @src imports in mero-crm module...\n');
const fixedCount = processDirectory(crmSrcDir);
console.log(`\n✓ Fixed ${fixedCount} files`);
