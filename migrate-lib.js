const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const mapping = {
    // src/lib -> services, features
    'lib/marketdata': 'features/MarketData/services/marketdata',
    'lib/economicCalendar.ts': 'features/Calendar/services/economicCalendar.ts',
    'lib/confluence': 'features/Terminal/services/confluence',
    'lib/db.ts': 'services/db.ts',

    // store -> services/store
    'store': 'services/store',

    // context -> services/context
    'context': 'services/context',
};

const importMapping = {
    '@/lib/marketdata': '@/features/MarketData/services/marketdata',
    '@/lib/economicCalendar': '@/features/Calendar/services/economicCalendar',
    '@/lib/confluence': '@/features/Terminal/services/confluence',
    '@/lib/db': '@/services/db',

    '@/store': '@/services/store',
    '@/context': '@/services/context',
};

// 1. Ensure target dirs exist
const dirsToCreate = [
    'features/MarketData/services',
    'features/Calendar/services',
    'features/Terminal/services',
    'services'
];

for (const dir of dirsToCreate) {
    fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
}

// 2. Move files
console.log("Moving files...");
for (const [source, dest] of Object.entries(mapping)) {
    const srcPath = path.join(srcDir, source);
    const destPath = path.join(srcDir, dest);
    if (fs.existsSync(srcPath)) {
        console.log(`Moving ${source} to ${dest}`);
        try {
            if (fs.lstatSync(srcPath).isDirectory() && fs.existsSync(destPath)) {
                // skip
            } else {
                fs.renameSync(srcPath, destPath);
            }
        } catch (e) {
            console.error(`Failed to move ${source}:`, e);
        }
    }
}

// 3. Update imports in all files in src/
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

const allFiles = walk(srcDir);
console.log("Updating imports...");
for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [oldImport, newImport] of Object.entries(importMapping)) {
        const regex = new RegExp(`['"]${oldImport}(/.*)?['"]`, 'g');
        content = content.replace(regex, (match, p1) => {
            changed = true;
            const remains = p1 || '';
            return "'" + newImport + remains + "'";
        });
    }

    if (changed) {
        console.log(`Updated imports in ${file.replace(srcDir, '')}`);
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log("Done");
