import { prisma } from "../../lib/prisma.js";
import { registerChatHandlers } from "../../src/sockets/handlers/chatHandler.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { createMockSocket } from "../helpers/createMockSocket.js";
import { mockIO } from "../setup.js";

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

    registerChatHandlers(mockIO, mockSocketA);
    registerChatHandlers(mockIO, mockSocketB);
    registerChatHandlers(mockIO, mockSocketC);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('chat_read', () => {
    it('should update read status in DB and broadcast chat_read to the room if user is an active member', async () => {
      await mockSocketA.emitClientEvent('chat_read', { chatId: directChat.id });

      expect(mockIO.to).toHaveBeenCalledWith([`user:${userBob.id}`]);
      expect(mockIO.emit).toHaveBeenCalledWith(
        'chat_read',
        expect.objectContaining({
          chatId: directChat.id,
          userId: currentUser.id,
          lastReadAt: expect.any(String),
        })
      );

      const member = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId: directChat.id,
          },
        },
      });

      expect(member.lastReadAt).not.toBeNull();
    });

    it('should NOT update or broadcast if user is not a member', async () => {
      await mockSocketC.emitClientEvent('chat_read', { chatId: directChat.id });

      expect(mockSocketC.to).not.toHaveBeenCalled();
      expect(mockSocketC.toEmit).not.toHaveBeenCalled();
    });

    it('should NOT update or broadcast if user has left the chat', async () => {
      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId: directChat.id,
          },
        },
        data: { leftAt: new Date() },
      });

      await mockSocketA.emitClientEvent('chat_read', { chatId: directChat.id });

      expect(mockSocketA.to).not.toHaveBeenCalled();
      expect(mockSocketA.toEmit).not.toHaveBeenCalled();
    });
  });
});