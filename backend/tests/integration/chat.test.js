import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";

describe("Chat Routes Integration Tests", () => {
  let agentA;
  let agentB;
  let agentC;
  let currentUser;
  let userBob;
  let userCharlie;
  
  beforeEach(async () => {
    const setupA = await createAuthenticatedAgent();
    agentA = setupA.agent;
    currentUser = setupA.user;

    const setupB = await createAuthenticatedAgent();
    agentB = setupB.agent;
    userBob = setupB.user;

    const setupC = await createAuthenticatedAgent();
    agentC = setupC.agent;
    userCharlie = setupC.user;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  describe("POST /api/chats", () => {
    
    it('should return a new chat if no chat exists yet', async () => {
      const res = await agentA
        .post('/api/chats')
        .send({
          receiverId: userBob.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.chat).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          isGroup: false,
          name: null,
          avatarUrl: null,
          lastMessageAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          messages: [],
        }),
      );

      expect(res.body.data.chat.members).toHaveLength(2);

      expect(res.body.data.chat.members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: currentUser.id,
            role: 'MEMBER',
            user: expect.objectContaining({
              id: currentUser.id,
              profile: expect.anything(),
            }),
          }),
          expect.objectContaining({
            userId: userBob.id,
            role: 'MEMBER',
            user: expect.objectContaining({
              id: userBob.id,
              profile: expect.anything(),
            }),
          }),
        ])
      );
    });

    it('should return the existing chat if one already exists', async () => {
      const firstRes = await agentA
        .post('/api/chats')
        .send({
          receiverId: userBob.id,
        });
      const newChat = firstRes.body.data.chat;

      const secondRes = await agentA
        .post('/api/chats')
        .send({
          receiverId: userBob.id,
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.chat.id).toBe(newChat.id);
    });


    it('should return the existing chat if one was created by the other member', async () => {
      const firstRes = await agentA
        .post('/api/chats')
        .send({
          receiverId: userBob.id,
        });
      const newChat = firstRes.body.data.chat;

      const secondRes = await agentB
        .post('/api/chats')
        .send({
          receiverId: currentUser.id,
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.chat.id).toBe(newChat.id)
    });

    it('should reject if currentUserId is equal to receiverId', async () => {
      const res = await agentA
        .post('/api/chats')
        .send({
          receiverId: currentUser.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject if receiverId doesnt exist', async () => {
      const res = await agentA
        .post('/api/chats')
        .send({
          receiverId: '00000000-0000-0000-0000-000000000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/chats', () => {

    it('should return an empty array if the user has no chats', async () => {
      const res = await agentA.get('/api/chats');
      expect(res.status).toBe(200);
      expect(res.body.data.chats).toEqual([]);
    });

    it('should return formatted chat summaries with lastMessage and counts', async () => {
      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chatId = chatRes.body.data.chat.id;

      await prisma.message.createMany({
        data: [
          { chatId, senderId: currentUser.id, text: 'First!' },
          { chatId, senderId: userBob.id, text: 'Second!' },
        ],
      });

      const res = await agentA.get('/api/chats');

      expect(res.status).toBe(200);
      const chats = res.body.data.chats;
      
      expect(chats).toHaveLength(1);
      
      expect(chats[0]).toEqual(
        expect.objectContaining({
          id: chatId,
          totalMessages: 2,
          isUnread: expect.any(Boolean),
          messages: [
            expect.objectContaining({
              text: 'Second!',
              senderId: userBob.id,
              sender: expect.objectContaining({
                id: userBob.id,
                profile: expect.any(Object),
              }),
            }),
          ],
        }),
      );
    });

    it('should order multiple chats by lastMessageAt descending and isolate users', async () => {
      const chat1Res = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chat1Id = chat1Res.body.data.chat.id;

      const chat2Res = await agentA.post('/api/chats').send({ receiverId: userCharlie.id });
      const chat2Id = chat2Res.body.data.chat.id;

      const timeOlder = new Date('2026-09-01T10:00:00Z');
      const timeNewer = new Date('2026-09-06T10:00:00Z');

      await prisma.chat.update({ where: { id: chat1Id }, data: { lastMessageAt: timeNewer } });
      await prisma.chat.update({ where: { id: chat2Id }, data: { lastMessageAt: timeOlder } });

      const resA = await agentA.get('/api/chats');
      expect(resA.status).toBe(200);
      const chatsA = resA.body.data.chats;
      
      expect(chatsA).toHaveLength(2);
      expect(chatsA[0].id).toBe(chat1Id);
      expect(chatsA[1].id).toBe(chat2Id);

      const resB = await agentB.get('/api/chats');
      const chatsB = resB.body.data.chats;
      expect(chatsB).toHaveLength(1);
      expect(chatsB[0].id).toBe(chat1Id);
    });

    it('should correctly mark isUnread based on lastReadAt timestamp', async () => {
      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chatId = chatRes.body.data.chat.id;

      const messageTime = new Date('2026-09-06T12:00:00Z');

      await prisma.message.create({
        data: {
          chatId,
          senderId: userBob.id,
          text: 'Hey Alice!',
          createdAt: messageTime,
        },
      });

      await prisma.chatMember.updateMany({
        where: { chatId, userId: currentUser.id },
        data: { lastReadAt: new Date('2026-09-06T11:59:00Z') },
      });

      let res = await agentA.get('/api/chats');
      expect(res.body.data.chats[0].isUnread).toBe(true);

      await prisma.chatMember.updateMany({
        where: { chatId, userId: currentUser.id },
        data: { lastReadAt: new Date('2026-09-06T12:01:00Z') },
      });

      res = await agentA.get('/api/chats');
      expect(res.body.data.chats[0].isUnread).toBe(false);
    });

    it('should not mark isUnread as true if the current user sent the last message', async () => {
      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chatId = chatRes.body.data.chat.id;

      await prisma.message.create({
        data: {
          chatId,
          senderId: currentUser.id,
          text: 'My outgoing message',
          createdAt: new Date('2026-09-06T12:00:00Z'),
        },
      });

      await prisma.chatMember.updateMany({
        where: { chatId, userId: currentUser.id },
        data: { lastReadAt: new Date('2026-09-06T11:00:00Z') },
      });

      const res = await agentA.get('/api/chats');
      expect(res.status).toBe(200);
      expect(res.body.data.chats[0].isUnread).toBe(false);
    });
  });
});