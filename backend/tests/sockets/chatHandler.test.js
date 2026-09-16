import { prisma } from "../../lib/prisma.js";
import { registerChatHandlers } from "../../src/sockets/handlers/chatHandler.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { createMockSocket } from "../helpers/createMockSocket.js";

describe('Chat Socket Handlers', () => {
  let currentUser;
  let userBob
  let userCharlie
  let directChat;
  let mockSocketA;
  let mockSocketB;
  let mockSocketC;

  beforeEach(async () => {
    const setupA = await createAuthenticatedAgent();
    currentUser = setupA.user;

    const setupB = await createAuthenticatedAgent({}, { displayName: 'Bob Test' });
    userBob = setupB.user;

    const setupC = await createAuthenticatedAgent({}, { displayName: 'Charlie Test' });
    userCharlie = setupC.user;

    directChat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: currentUser.id, role: 'MEMBER' },
            { userId: userBob.id, role: 'MEMBER'},
          ],
        },
      },
      include: {
        members: true,
        messages: true,
      }
    });

    mockSocketA = createMockSocket(currentUser.id);
    mockSocketB = createMockSocket(userBob.id);
    mockSocketC = createMockSocket(userCharlie.id);

    registerChatHandlers(null, mockSocketA);
    registerChatHandlers(null, mockSocketB);
    registerChatHandlers(null, mockSocketC);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('chat_open', () => {
    
    it('should join the chat room if user is an active member', async () => {
      await mockSocketA.emitClientEvent('chat_open', directChat.id);

      expect(mockSocketA.join).toHaveBeenCalledWith(`chat:${directChat.id}`);

      expect(mockSocketA.to).toHaveBeenCalledWith(`chat:${directChat.id}`);

      expect(mockSocketA.toEmit).toHaveBeenCalledWith(
        'chat_read',
        expect.objectContaining({
          chatId: directChat.id,
          userId: currentUser.id,
        })
      );
    });

    it('should NOT join the room if user is not a member', async () => {
      await mockSocketC.emitClientEvent('chat_open', directChat.id);

      expect(mockSocketC.join).not.toHaveBeenCalled();
    });

    it('should NOT join the room if user has left the chat', async () => {
      await prisma.chatMember.update({
        where: { 
          userId_chatId: {
            userId: currentUser.id,
            chatId: directChat.id,
          },
        },
        data: { leftAt: new Date() },
      });

      await mockSocketA.emitClientEvent('chat_open', directChat.id);

      expect(mockSocketA.join).not.toHaveBeenCalled();
    });

    it('should safely ignore falsy or missing chatId', async () => {
      await mockSocketA.emitClientEvent('chat_open', null);
      await mockSocketA.emitClientEvent('chat_open', undefined);

      expect(mockSocketA.join).not.toHaveBeenCalled();
    });
  });

  describe('chat_close', () => {
    it('should leave the chat room when chat_close is received', async () => {
      await mockSocketA.emitClientEvent('chat_close', directChat.id);

      expect(mockSocketA.leave).toHaveBeenCalledWith(`chat:${directChat.id}`);
    });

    it('should safely ignore falsy chatId on chat_close', async () => {
      await mockSocketA.emitClientEvent('chat_close', null);

      expect(mockSocketA.leave).not.toHaveBeenCalled();
    });
  });
});