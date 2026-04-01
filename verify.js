const fs = require('fs');
const path = require('path');

const structureFile = path.join(__dirname, 'structure by cluade .md');
const content = fs.readFileSync(structureFile, 'utf8');

const lines = content.split('\n');

let currentDir = ['']; // root

let fileCount = 0;
let dirCount = 0;
const checkedPaths = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.includes('│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) continue;

    const trimLine = line.trimEnd();

    // Look for file or directory names
    let match = trimLine.match(/(?:├──|└──|│)\s+(?:[📄🖼]\s+)?([^←]+)/);
    if (!match) {
        match = trimLine.match(/^([a-zA-Z0-9_-]+)\//);
        if (match) {
            currentDir = [match[1]];
            dirCount++;
            continue;
        }
        continue;
    }

    let name = match[1].trim();
    if (!name) continue;

    // Calculate depth by counting the leading symbols spacing.
    // ├── is 3 chars. Every level of indentation is roughly 4 spaces.
    let leadingSpace = trimLine.substring(0, match.index);
    let depth = Math.floor(leadingSpace.length / 4);

    if (trimLine.includes('└──')) {
        // depth calculation is same
    }

    const isDir = name.endsWith('/');
    if (isDir) {
        name = name.slice(0, -1);
        currentDir = currentDir.slice(0, depth);
        currentDir.push(name);
        dirCount++;
    } else {
        // It's a file
        name = name.split(' ')[0]; // remove trailing comments if any
        currentDir = currentDir.slice(0, depth);
        const fullPath = path.join(__dirname, ...currentDir, name);
        checkedPaths.push(fullPath);
        fileCount++;
    }
}

console.log("Found", fileCount, "files and", dirCount, "directories to check.");

const missing = checkedPaths.filter(p => !fs.existsSync(p));
console.log("Missing matches:", missing.length);

if (missing.length > 0) {
    console.log(missing.slice(0, 20).join('\n'));
} else {
    // Print first 5 just to prove it worked
    console.log("Checked examples:");
    console.log(checkedPaths.slice(0, 5).join('\n'));
}
