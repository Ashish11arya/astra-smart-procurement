const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT * FROM _prisma_migrations`);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Table does not exist or error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
