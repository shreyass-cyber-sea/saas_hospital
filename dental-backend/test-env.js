require('dotenv').config();
const url = process.env.DATABASE_URL;
console.log('DATABASE_URL set:', url ? 'YES' : 'NO');
if (url) console.log('URL starts with:', url.substring(0, 30));
