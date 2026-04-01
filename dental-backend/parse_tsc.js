const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  fs.writeFileSync('errors-utf8.txt', 'No errors');
} catch (e) {
  fs.writeFileSync('errors-utf8.txt', e.stdout.toString('utf8'));
}
