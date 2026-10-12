import { matchedData } from "express-validator";
import { findAllRelationships, findExistingRelationship } from "../services/friendshipService.js";
import { prisma } from "../../lib/prisma.js";
import { friendshipEmitter } from "../sockets/emitters/friendshipEmitter.js";

export const getFriendships = async (req, res) => {
  const currentUserId = req.user?.id;
  const { status, type } = matchedData(req);

  const friendships = await findAllRelationships(currentUserId, status, type);

  return res.json({
    success: true,
    data: { 
      friendships 
    },
  });
};

export const sendFriendRequest = async (req, res) => {
  const senderId = req.user?.id;
  const { receiverId } = matchedData(req);

  const existingFriendship = await findExistingRelationship(senderId, receiverId);
  
  if (existingFriendship) {
    switch (existingFriendship.status) {
      case 'BLOCKED':
        return res.status(400).json({
          success: false,
          message: 'Unable to send request.'
        });

      case 'ACCEPTED':
        return res.status(400).json({
          success: false,
          message: 'You are already friends.'
        });

      case 'PENDING':
        return res.status(400).json({
          success: false,
          message: 'A friend request is already pending.'
        });

      case 'DECLINED': {
        const refreshedFriendship = await prisma.friendship.update({
          where: { id: existingFriendship.id },
          data: {
            senderId,
            receiverId,
            status: 'PENDING',
          },
          include: {
            sender: {
              include: {
                profile: true
              },
            },
          },
        });

        friendshipEmitter.emitFriendshipRequested(receiverId, refreshedFriendship);

        return res.json({
          success: true,
          message: 'Friend request sent.',
          data: { friendship: refreshedFriendship },
        });
      }

      default:
        break;
    }
  }

  const friendship = await prisma.friendship.create({
    data: {
      senderId,
      receiverId,
      status: 'PENDING',
    },
    include: {
      sender: {
        include: {
          profile: true
        },
      },
    },
  });

  friendshipEmitter.emitFriendshipRequested(receiverId, friendship);

  return res.status(201).json({
    success: true,
    message: 'Friend request sent.',
    data: { friendship },
  });
};

export const updateFriendship = async (req, res) => {
  const currentUserId = req.user?.id;
  const { friendshipId, status } = matchedData(req);

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return res.status(404).json({
      success: false,
      message: 'Friendship not found.',
    });
  }

  if (friendship.receiverId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden.',
    });
  }

  if (friendship.status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      message: 'Request is no longer pending.',
    });
  }

  const updatedFriendship = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status },
    include: {
      receiver: {
        include: {
          profile: true
        },
      },
    },
  });

  if (status === 'ACCEPTED') {
    friendshipEmitter.emitFriendshipAccepted(updatedFriendship);
  }

  return res.json({
    success: true,
    message: `Request ${status}.`,
    data: {
      friendship: updatedFriendship,
    },
  });
};

export const deleteFriendship = async (req, res) => {
  const currentUserId = req.user?.id;
  const { friendshipId } = matchedData(req);

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    return res.status(404).json({
      success: false,
      message: 'Friendship not found.',
    });
  }

  const isSender = currentUserId === friendship.senderId;
  const isReceiver = currentUserId === friendship.receiverId;

  if (friendship.status === 'BLOCKED' || (!isSender && !isReceiver)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden.',
    });
  }

  if (friendship.status === 'PENDING' && !isSender) {
    return res.status(403).json({
      success: false,
      message: 'Only the sender can cancel a pending friend request.',
    });
  }

  await prisma.friendship.delete({
    where: { id: friendshipId },
  });

  return res.json({
    success: true,
    message: friendship.status === 'PENDING' 
      ? 'Friend request cancelled.' 
      : 'Friend removed successfully.',
  });
};

export const blockUser = async (req, res) => {
  const senderId = req.user?.id;
  const { receiverId } = matchedData(req);

  const existingFriendship = await findExistingRelationship(senderId, receiverId);

  let friendship;
  let statusCode;

  if (existingFriendship?.status === 'BLOCKED') {
    return res.status(400).json({
      success: false,
      message: 'User is already blocked.',
    });
  }

  if (existingFriendship) {
    friendship = await prisma.friendship.update({
      where: { id: existingFriendship.id },
      data: {
        senderId,
        receiverId,
        status: 'BLOCKED',
      },
    });
    statusCode = 200;
  } else {
    friendship = await prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'BLOCKED',
      },
    });
    statusCode = 201;
  }

  return res.status(statusCode).json({
    success: true,
    message: 'User has been blocked.',
    data: { friendship },
  });
};

export const unblockUser = async (req, res) => {
  const senderId = req.user?.id;
  const { receiverId } = matchedData(req);

  const existingFriendship = await findExistingRelationship(senderId, receiverId);

  if (!existingFriendship || existingFriendship?.status !== 'BLOCKED') {
    return res.status(404).json({
      success: false,
      message: 'Blocked relationship not found.',
    });
  }

  if (existingFriendship.senderId !== senderId) {
    return res.status(400).json({
      success: false,
      message: 'Unnable to unblock.',
    });
  }

  await prisma.friendship.delete({
    where: { id: existingFriendship.id },
  });

  return res.json({
    success: true,
    message: 'User unblocked successfully.',
  });
};