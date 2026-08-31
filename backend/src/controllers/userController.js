import { matchedData } from "express-validator";
import { prisma } from "../../lib/prisma.js";

export const searchUser = async (req, res) => {
  const { search } = matchedData(req);
  const userId = req.user?.id;

  if (!search) {
    return res.json({
      success: true,
      data: { 
        users: [],
      },
    });
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        {
          profile: {
            displayName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
    take: 20,
    select: {
      id: true,
      username: true,
      createdAt: true,
      profile: true,
    },
  });

  return res.json({
    success: true,
    data: { users },
  });
};