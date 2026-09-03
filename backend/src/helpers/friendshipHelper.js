import { prisma } from "../../lib/prisma.js";

export const findExistingRelationship = async (userAId, userBId) => {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
  });
};