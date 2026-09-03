import { prisma } from "../../lib/prisma";
import { createTestUser } from "./authHelper";

export async function createFriendship(friendshipOverrides = {}) {
  let sender = null;
  let receiver = null;

  let senderId = friendshipOverrides.senderId;
  let receiverId = friendshipOverrides.receiverId;

  if (!senderId) {
    const createdSender = await createTestUser({}, { displayName: 'Sender User' });
    sender = createdSender.testUser;
    senderId = sender.id;
  }

  if (!receiverId) {
    const createdReceiver = await createTestUser({}, { displayName: 'Receiver User' });
    receiver = createdReceiver.testUser;
    receiverId = receiver.id;
  }

  const friendship = await prisma.friendship.create({
    data: {
      senderId,
      receiverId,
      status: friendshipOverrides.status ?? 'PENDING',
      ...friendshipOverrides,
    },
  });

  return {
    friendship,
    sender,
    receiver,
  };
};