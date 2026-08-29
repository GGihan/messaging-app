import { prisma } from "../lib/prisma.js";



async function main() {
  console.log('Start seeding...');

  

  console.log('Seeding finished.');
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Error during seeding:', error);
    await prisma.$disconnect();
    process.exit(1);
  });