const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const mapping = {
    // UI
    'LayoutSettingsModal.tsx': 'components/ui/LayoutSettingsModal.tsx',
    'NotificationToast.tsx': 'components/ui/NotificationToast.tsx',
    'SettingsModal.tsx': 'components/ui/SettingsModal.tsx',
    'Widget.tsx': 'components/ui/Widget.tsx',
    'ui': 'components/ui',

    // Terminal
    'CommandPalette.tsx': 'features/Terminal/components/CommandPalette.tsx',
    'LayoutWrapper.tsx': 'features/Terminal/components/LayoutWrapper.tsx',
    'Navbar.tsx': 'features/Terminal/components/Navbar.tsx',
    'Sidebar.tsx': 'features/Terminal/components/Sidebar.tsx',
    'TerminalCommandBar.tsx': 'features/Terminal/components/TerminalCommandBar.tsx',
    'widgets': 'features/Terminal/components/widgets',
    'notifications': 'features/Terminal/components/notifications',

    // MarketData
    'MiniChart.tsx': 'features/MarketData/components/MiniChart.tsx',
    'TradingChart.tsx': 'features/MarketData/components/TradingChart.tsx',
    'TradingViewChart.tsx': 'features/MarketData/components/TradingViewChart.tsx',
    'macro': 'features/MarketData/components/macro',

    // Calendar
    'EconomicCalendarList.tsx': 'features/Calendar/components/EconomicCalendarList.tsx',
    'calendar': 'features/Calendar/components/calendar',

    // News
    'NewsFeed.tsx': 'features/News/components/NewsFeed.tsx'
};

const importMapping = {
    // Exact path fragments
    '@/components/LayoutSettingsModal': '@/components/ui/LayoutSettingsModal',
    '@/components/NotificationToast': '@/components/ui/NotificationToast',
    '@/components/SettingsModal': '@/components/ui/SettingsModal',
    '@/components/Widget': '@/components/ui/Widget',

    '@/components/CommandPalette': '@/features/Terminal/components/CommandPalette',
    '@/components/LayoutWrapper': '@/features/Terminal/components/LayoutWrapper',
    '@/components/Navbar': '@/features/Terminal/components/Navbar',
    '@/components/Sidebar': '@/features/Terminal/components/Sidebar',
    '@/components/TerminalCommandBar': '@/features/Terminal/components/TerminalCommandBar',
    '@/components/widgets': '@/features/Terminal/components/widgets',
    '@/components/notifications': '@/features/Terminal/components/notifications',

    '@/components/MiniChart': '@/features/MarketData/components/MiniChart',
    '@/components/TradingChart': '@/features/MarketData/components/TradingChart',
    '@/components/TradingViewChart': '@/features/MarketData/components/TradingViewChart',
    '@/components/macro': '@/features/MarketData/components/macro',

    '@/components/EconomicCalendarList': '@/features/Calendar/components/EconomicCalendarList',
    '@/components/calendar': '@/features/Calendar/components/calendar',

    '@/components/NewsFeed': '@/features/News/components/NewsFeed',
};

// 1. Ensure target dirs exist
const dirsToCreate = [
    'features/Terminal/components',
    'features/MarketData/components',
    'features/Calendar/components',
    'features/News/components',
    'components/ui'
];

for (const dir of dirsToCreate) {
    fs.mkdirSync(path.join(srcDir, dir), { recursive: true });
}

// 2. Move files
console.log("Moving files...");
for (const [source, dest] of Object.entries(mapping)) {
    const srcPath = path.join(srcDir, 'components', source);
    const destPath = path.join(srcDir, dest);
    if (fs.existsSync(srcPath)) {
        console.log(`Moving ${source} to ${dest}`);
        try {
            if (fs.lstatSync(srcPath).isDirectory() && fs.existsSync(destPath)) {
                // if dest exists, we have to move contents or replace
                // For simple moving, renameSync sometimes fails if dest dir exists and not empty, but taking it simply:
                // ui dir might exist, so we skip moving ui dir completely but it's empty so fine.
            }
            fs.renameSync(srcPath, destPath);
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
        // Regex to match exact import path, with optional trailing slash or quotes
        const regex = new RegExp(`['"]${oldImport}(/.*)?['"]`, 'g');
        content = content.replace(regex, (match, p1) => {
            changed = true;
            const remains = p1 || '';
            return "'" + newImport + remains + "'";
        });
    }

    if (changed) {
        console.log(`Updated imports in ${file.replace(srcDir, '')} `);
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log("Done");
