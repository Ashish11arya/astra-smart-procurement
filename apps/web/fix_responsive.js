const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix main max-w-7xl containers to not overflow horizontally
            const newContent = content.replace(/className=\"max-w-7xl mx-auto/g, 'className=\"w-full min-w-0 max-w-7xl mx-auto');
            if (newContent !== content) {
                content = newContent;
                modified = true;
            }

            // Fix card containers that might hold tables to min-w-0 to prevent flex blowout
            const newContent2 = content.replace(/className=\"([^\"}]*bg-\[#151C2F\][^\"}]*rounded-2xl[^\"}]*shadow-lg[^\"}]*)\"/g, (match, p1) => {
                let parts = p1.split(' ');
                if (!parts.includes('w-full')) parts.unshift('w-full');
                if (!parts.includes('min-w-0')) parts.unshift('min-w-0');
                return 'className=\"' + parts.join(' ') + '\"';
            });
            if (newContent2 !== content) {
                content = newContent2;
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', fullPath);
            }
        }
    }
}

processDir('d:/Astra/apps/web/src/app');
