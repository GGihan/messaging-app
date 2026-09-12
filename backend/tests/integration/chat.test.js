import { cloudinaryService } from "../../lib/cloudinary.js";
import { beforeEach, expect, jest } from '@jest/globals';
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

    const setupB = await createAuthenticatedAgent({}, { displayName: 'Bob Test' });
    agentB = setupB.agent;
    userBob = setupB.user;

    const setupC = await createAuthenticatedAgent({}, { displayName: 'Charlie Test' });
    agentC = setupC.agent;
    userCharlie = setupC.user;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
          { chatId, 
            senderId: currentUser.id,
            text: 'First!',
            createdAt: new Date(Date.now() - 5000),
          },
          { chatId,
            senderId: userBob.id,
            text: 'Second!',
            createdAt: new Date(),
          },
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

      const joinTime = new Date('2026-09-06T11:00:00Z');
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
        data: {
          joinedAt: joinTime,
          lastReadAt: new Date('2026-09-06T11:59:00Z'),
        },
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

    it('should not return chats with member deletedAt not null', async () => {
      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chatId = chatRes.body.data.chat.id;

      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId,
          },
        },
        data: { deletedAt: new Date('2026-09-06T11:00:00Z') },
      });

      const res = await agentA.get('/api/chats');
      expect(res.status).toBe(200);
      expect(res.body.data.chats.length).toBe(0);
    });

    it('should not include members with leftAt not null', async () => {
      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chatId = chatRes.body.data.chat.id;

      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId,
          },
        },
        data: { leftAt: new Date('2026-09-06T11:00:00Z') },
      });

      const res = await agentA.get('/api/chats');
      expect(res.status).toBe(200);
      expect(res.body.data.chats[0].members.length).toBe(1);
    });

    it('should search by optional query and return matched direct chat', async () => {
      await agentA.post('/api/chats').send({ receiverId: userCharlie.id });

      const chatRes = await agentA.post('/api/chats').send({ receiverId: userBob.id });
      const chat = chatRes.body.data.chat;

      const bobMember = chat.members.find((m) => m.userId === userBob.id);
      const bobDisplayName = bobMember.user.profile.displayName;

      const res = await agentA.get(`/api/chats?search=${encodeURIComponent(bobDisplayName)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.chats).toHaveLength(1);
      expect(res.body.data.chats[0].id).toBe(chat.id);
    });

    it('should search by optional query and return matched group chat', async () => {
      const firstRes = await agentA
        .post('/api/chats/groups')
        .send({
          name: 'First Group',
          memberIds: [userBob.id, userCharlie.id],
        });

      const secondRes = await agentB
        .post('/api/chats/groups')
        .send({
          name: 'Second Group',
          memberIds: [currentUser.id, userCharlie.id],
        });

      const firstChat = firstRes.body.data.chat;
      const secondChat = secondRes.body.data.chat;

      const firstSearch = await agentA.get(`/api/chats?search=${encodeURIComponent(firstChat.name)}`);
      expect(firstSearch.status).toBe(200);
      expect(firstSearch.body.data.chats).toHaveLength(1);
      expect(firstSearch.body.data.chats[0].id).toBe(firstChat.id);

      const secondSearch = await agentA.get(`/api/chats?search=${encodeURIComponent(secondChat.name)}`);
      expect(secondSearch.status).toBe(200);
      expect(secondSearch.body.data.chats).toHaveLength(1);
      expect(secondSearch.body.data.chats[0].id).toBe(secondChat.id);
    });
  });

  describe('Group Chat Integration Tests', () => {

    describe('POST /api/chats/groups', () => {

      it('should create a group chat without an avatar and set correct member roles', async () => {
        const uploadSpy = jest.spyOn(cloudinaryService, 'uploadChatAvatar');

        const res = await agentA
          .post('/api/chats/groups')
          .send({
            name: 'Engineering Team',
            memberIds: [userBob.id, userCharlie.id],
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(uploadSpy).not.toHaveBeenCalled();

        const { chat } = res.body.data;
        expect(chat.name).toBe('Engineering Team');
        expect(chat.isGroup).toBe(true);
        expect(chat.avatarUrl).toBeNull();
        expect(chat.members).toHaveLength(3);

        // Verify creator is ADMIN and invitees are MEMBER
        const creator = chat.members.find((m) => m.userId === currentUser.id);
        const bob = chat.members.find((m) => m.userId === userBob.id);
        const charlie = chat.members.find((m) => m.userId === userCharlie.id);

        expect(creator.role).toBe('ADMIN');
        expect(bob.role).toBe('MEMBER');
        expect(charlie.role).toBe('MEMBER');

        // Verify persisted state in the database
        const dbChat = await prisma.chat.findUnique({
          where: { id: chat.id },
          include: { members: true },
        });
        expect(dbChat).not.toBeNull();
        expect(dbChat.name).toBe('Engineering Team');
        expect(dbChat.members).toHaveLength(3);
      });

      it('should upload a group avatar to Cloudinary and link it to the chat in DB', async () => {
        const fakeSecureUrl = 'https://res.cloudinary.com/demo/image/upload/v1/group-avatar.jpg';

        const uploadSpy = jest
          .spyOn(cloudinaryService, 'uploadChatAvatar')
          .mockResolvedValueOnce({ secure_url: fakeSecureUrl });

        const dummyImageBuffer = Buffer.from('fake-group-avatar-bytes');

        const res = await agentA
          .post('/api/chats/groups')
          .field('name', 'Design Sprint')
          .field('memberIds[0]', userBob.id)
          .field('memberIds[1]', userCharlie.id)
          .attach('avatar', dummyImageBuffer, 'group-avatar.png');

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        const { chat } = res.body.data;
        expect(chat.avatarUrl).toBe(fakeSecureUrl);

        expect(uploadSpy).toHaveBeenCalledTimes(1);
        expect(uploadSpy).toHaveBeenCalledWith(expect.any(Buffer), chat.id);

        const dbChat = await prisma.chat.findUnique({
          where: { id: chat.id },
        });
        expect(dbChat.avatarUrl).toBe(fakeSecureUrl);
      });

      it('should return 502 if Cloudinary upload fails and not persist the chat', async () => {
        const uploadSpy = jest
          .spyOn(cloudinaryService, 'uploadChatAvatar')
          .mockRejectedValueOnce(new Error('Cloudinary server unavailable'));

        const dummyImageBuffer = Buffer.from('fake-group-avatar-bytes');

        const res = await agentA
          .post('/api/chats/groups')
          .field('name', 'Failed Upload Team')
          .field('memberIds[0]', userBob.id)
          .attach('avatar', dummyImageBuffer, 'group-avatar.png');

        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/upload failed/i);
        expect(uploadSpy).toHaveBeenCalledTimes(1);

        const dbChat = await prisma.chat.findFirst({
          where: { name: 'Failed Upload Team' },
        });
        expect(dbChat).toBeNull();
      });

      it('should reject when group name is missing', async () => {
        const res = await agentA
          .post('/api/chats/groups')
          .send({
            memberIds: [userBob.id],
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject when memberIds contains an invalid UUID', async () => {
        const res = await agentA
          .post('/api/chats/groups')
          .send({
            name: 'Invalid Members Group',
            memberIds: ['not-a-valid-uuid'],
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/chats/:chatId', () => {
      let testChat;

      beforeEach(async () => {
        testChat = await prisma.chat.create({
          data: {
            isGroup: true,
            name: 'old name',
            avatarUrl: 'old url',
            members: {
              create: [
                { userId: currentUser.id, role: 'ADMIN' },
                { userId: userBob.id, role: 'MEMBER' },
                { userId: userCharlie.id, role: 'MEMBER' },
              ],
            },
          },
        });
      });

      it('should update a group chat as ADMIN', async () => {
        const uploadSpy = jest
          .spyOn(cloudinaryService, 'uploadChatAvatar')
          .mockResolvedValueOnce({ secure_url: 'new url' });

        const dummyImageBuffer = Buffer.from('fake-group-avatar-bytes');

        const res = await agentA
          .patch(`/api/chats/${testChat.id}`)
          .field('name', 'new name')
          .attach('avatar', dummyImageBuffer, 'group-avatar.png');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(uploadSpy).toHaveBeenCalled();

        const { chat } = res.body.data;
        expect(chat.name).toBe('new name');
        expect(chat.isGroup).toBe(true);
        expect(chat.avatarUrl).toBe('new url');
      });

      it('should update a group chat without avatarUrl', async () => {
        const uploadSpy = jest
          .spyOn(cloudinaryService, 'uploadChatAvatar')

        const res = await agentA
          .patch(`/api/chats/${testChat.id}`)
          .field('name', 'new name')

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(uploadSpy).not.toHaveBeenCalled();

        const { chat } = res.body.data;
        expect(chat.name).toBe('new name');
        expect(chat.isGroup).toBe(true);
        expect(chat.avatarUrl).toBe('old url');
      });

      it('shouldnt update a group chat without ADMIN role', async () => {
        const res = await agentB
          .patch(`/api/chats/${testChat.id}`)
          .field('name', 'new name')

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/admin/i)
      });

      it('shouldnt update a group chat without a name', async () => {

        const res = await agentA
          .patch(`/api/chats/${testChat.id}`)

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.stringMatching(/empty/i),
            }),
          ]),
        );
      });
    });

    describe('DELETE /api/chats/:chatId', () => {
      let testChat;
      let deleteSpy;
      let getPublicIdSpy;
      const publicIdMock = 'avatars/chat-123';

      beforeEach(async () => {
        testChat = await prisma.chat.create({
          data: {
            isGroup: true,
            name: 'old name',
            avatarUrl: 'old url',
            members: {
              create: [
                { userId: currentUser.id, role: 'ADMIN' },
                { userId: userBob.id, role: 'MEMBER' },
                { userId: userCharlie.id, role: 'MEMBER' },
              ],
            },
          },
        });

        
        getPublicIdSpy = jest
          .spyOn(cloudinaryService, 'getPublicIdFromUrl')
          .mockReturnValue(publicIdMock);

        deleteSpy = jest
          .spyOn(cloudinaryService, 'deleteFromCloud')
          .mockResolvedValue({ result: 'ok' });
      });

      it('should delete a group chat and trigger Cloudinary cleanup', async () => {
        const res = await agentA
          .delete(`/api/chats/${testChat.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/delete/i);
        expect(deleteSpy).toHaveBeenCalled();
        expect(getPublicIdSpy).toHaveBeenCalled();

        const chatInDb = await prisma.chat.findUnique({ where: { id: testChat.id } });
        expect(chatInDb).toBeNull();
      });

      it('should not call Cloudinary if the group chat has no avatarUrl', async () => {
        await prisma.chat.update({
          where: { id: testChat.id },
          data: { avatarUrl: null },
        });

        const res = await agentA
          .delete(`/api/chats/${testChat.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/delete/i);
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(getPublicIdSpy).not.toHaveBeenCalled();
      });

      it('should return 403 if a non-admin member attempts to delete the chat', async () => {
        const res = await agentB
          .delete(`/api/chats/${testChat.id}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/chats/:chatId Integration Tests', () => {
    let sharedChat;

    beforeEach(async () => {
      sharedChat = await prisma.chat.create({
        data: {
          isGroup: false,
          lastMessageAt: new Date(),
          members: {
            create: [
              { userId: currentUser.id, role: 'MEMBER' },
              { userId: userBob.id, role: 'MEMBER' },
            ],
          },
          messages: {
            create: [
              {
                senderId: userBob.id,
                text: 'First message (older)',
                createdAt: new Date(Date.now() - 60000),
              },
              {
                senderId: currentUser.id,
                text: 'Second message (newer)',
                createdAt: new Date(),
              },
            ],
          },
        },
      });
    });

    it('should return chat with chronological enriched messages for a valid member', async () => {
      const res = await agentA.get(`/api/chats/${sharedChat.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { chat } = res.body.data;
      expect(chat.id).toBe(sharedChat.id);
      expect(chat.members).toHaveLength(2);

      expect(chat.messages).toHaveLength(2);

      expect(chat.messages[0].text).toBe('First message (older)');
      expect(chat.messages[1].text).toBe('Second message (newer)');

      expect(chat.messages[0]).toHaveProperty('isReadByMe');
      expect(chat.messages[0]).toHaveProperty('isReadByAll');
    });

    it('should return 404 when a user tries to access a chat they are not a member', async () => {
      const res = await agentC.get(`/api/chats/${sharedChat.id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should not return chat members with member leftAt not null', async () => {
      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: userBob.id,
            chatId: sharedChat.id,
          },
        },
        data: { leftAt: new Date('2026-09-06T11:00:00Z') },
      });

      const res = await agentA.get(`/api/chats/${sharedChat.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.chat.members.length).toBe(1);
    });

    it('should only return messages created after member deletedAt timestamp', async () => {
      const deletedAtTimestamp = new Date(Date.now() - 30000);

      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId: sharedChat.id,
          },
        },
        data: { deletedAt: deletedAtTimestamp },
      });

      const res = await agentA.get(`/api/chats/${sharedChat.id}`);

      expect(res.status).toBe(200);

      const chat = res.body.data.chat ?? res.body.data;
      const returnedMessages = chat.messages;

      expect(returnedMessages).toHaveLength(1);
      expect(returnedMessages[0].text).toBe('Second message (newer)',);
    });
  });

  describe('DELETE /api/chats/:chatId/history', () => {
    let sharedChat;

    beforeEach(async () => {
      sharedChat = await prisma.chat.create({
        data: {
          isGroup: true,
          name: 'test chat',
          members: {
            create: [
              { userId: currentUser.id, role: 'MEMBER' },
              { userId: userBob.id, role: 'MEMBER' },
            ],
          },
        },
      });
    });

    it('should successfully update deletedAt for the requesting member', async () => {
      const res = await agentA.delete(`/api/chats/${sharedChat.id}/history`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.chat).toBeDefined();

      const currentMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId: sharedChat.id,
          },
        },
      });

      expect(currentMember.deletedAt).not.toBeNull();
    });

    it('should not mutate deletedAt for other members in the chat', async () => {
      await agentA.delete(`/api/chats/${sharedChat.id}/history`);

      const bobMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: userBob.id,
            chatId: sharedChat.id,
          },
        },
      });

      expect(bobMember.deletedAt).toBeNull();
    });
  });
});