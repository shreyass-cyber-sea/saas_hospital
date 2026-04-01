const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx prisma generate', { encoding: 'utf8', env: process.env });
  fs.writeFileSync('prisma-out.txt', output);
} catch (e) {
  fs.writeFileSync('prisma-out.txt', e.stdout || e.message);
}
