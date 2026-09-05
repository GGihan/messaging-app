import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";

describe("Chat Routes Integration Tests", () => {
  let agentA;
  let agentB;
  let currentUser;
  let userBob;

  beforeEach(async () => {
    const setupA = await createAuthenticatedAgent();
    agentA = setupA.agent;
    currentUser = setupA.user;

    const setupB = await createAuthenticatedAgent();
    agentB = setupB.agent;
    userBob = setupB.user;
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
      expect(secondRes.body.data.chat.id).toBe(newChat.id)
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
});