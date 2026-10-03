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

            // Fix all max-w-* mx-auto to have w-full min-w-0
            const newContent = content.replace(/className=\"(max-w-[0-9a-zA-Z]+) mx-auto/g, (match, p1) => {
                if (content.includes('w-full min-w-0 ' + p1)) return match;
                return 'className=\"w-full min-w-0 ' + p1 + ' mx-auto';
            });
            if (newContent !== content) {
                content = newContent;
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed wrapper in:', fullPath);
            }
        }
    }
}

processDir('d:/Astra/apps/web/src/app');
