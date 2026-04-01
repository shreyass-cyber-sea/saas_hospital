const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  console.log('Testing Prisma connection with URL:', process.env.DATABASE_URL);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('✅ Connection successful!');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Query successful! Found', users.length, 'users.');
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
