const { spawnSync } = require('child_process');
const result = spawnSync('npm.cmd', ['run', 'start'], { encoding: 'utf-8', cwd: __dirname });
require('fs').writeFileSync('clean_log.txt', (result.stdout || '') + '\n\nSTDERR:\n\n' + (result.stderr || ''));
