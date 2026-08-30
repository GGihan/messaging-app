import { prisma } from "../../lib/prisma.js";

// Resets only database test data, that isn't created by prisma seed.js
export async function resetDb() {
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Session" CASCADE;');
};