import { jest } from "@jest/globals";
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { cloudinaryService } from "../../src/services/cloudinaryService.js";
import { mockIO } from "../setup.js";

describe("ChatMember Routes Integration Tests", () => {
  let agentA;
  let agentB;
  let agentC;
  let currentUser;
  let userBob;
  let userCharlie;
  let groupChat;
  let directChat;
  let fakeSecureUrl = 'https://res.cloudinary.com/demo/image/upload/v2/new-avatar.jpg';
  let dummyImageBuffer = Buffer.from('fake-image-bytes');
  
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

    groupChat = await prisma.chat.create({
      data: {
        isGroup: true,
        members: {
          create: [
            { userId: currentUser.id, role: 'ADMIN' },
            { userId: userBob.id, role: 'MEMBER', joinedAt: new Date(Date.now() - 60000) },
            { userId: userCharlie.id, role: 'MEMBER'},
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
      include: {
        members: true,
        messages: true,
      }
    });

    directChat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: currentUser.id, role: 'MEMBER'},
            { userId: userCharlie.id, role: 'MEMBER'},
          ],
        },
      },
      include: {
        members: true,
        messages: true,
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/chats/:chatId/messages", () => {
    
    it('should create a message in a group chat with text and a single image', async () => {
      const text = 'Hello group!';
      const uploadSpy = jest
        .spyOn(cloudinaryService, 'uploadMessageAttachment')
        .mockResolvedValueOnce({ secure_url: fakeSecureUrl });

      const res = await agentB
        .post(`/api/chats/${groupChat.id}/messages`)
        .field('text', text)
        .attach('image', dummyImageBuffer, 'sample.jpg');

      expect(res.status).toBe(201);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy).toHaveBeenCalledWith(expect.any(Buffer), groupChat.id);
      expect(res.body.data.message.text).toBe(text);
      expect(res.body.data.message.imageUrl).toBe(fakeSecureUrl);
      expect(res.body.data.message.chatId).toBe(groupChat.id);
      expect(res.body.data.message.senderId).toBe(userBob.id);

      const savedMessage = await prisma.message.findUnique({
        where: { id: res.body.data.message.id },
      });
      expect(savedMessage).not.toBeNull();
      expect(savedMessage.text).toBe(text);
      expect(savedMessage.imageUrl).toBe(fakeSecureUrl);

      const updatedChat = await prisma.chat.findUnique({
        where: { id: groupChat.id },
      });
      expect(new Date(updatedChat.lastMessageAt).getTime()).toBe(
        new Date(savedMessage.createdAt).getTime()
      );

      const senderMember = await prisma.chatMember.findFirst({
        where: { chatId: groupChat.id, userId: userBob.id },
      });
      expect(new Date(senderMember.lastReadAt).getTime()).toBe(
        new Date(savedMessage.createdAt).getTime()
      );
    });

    it('should create a text-only message in a group chat without invoking cloudinary', async () => {
      const text = 'Just some text, no image.';
      const uploadSpy = jest.spyOn(cloudinaryService, 'uploadMessageAttachment');

      const res = await agentA
        .post(`/api/chats/${groupChat.id}/messages`)
        .field('text', text);

      expect(res.status).toBe(201);
      expect(uploadSpy).not.toHaveBeenCalled();
      expect(res.body.data.message.text).toBe(text);
      expect(res.body.data.message.imageUrl).toBeNull();
    });

    it('should create an image-only message in a direct chat without text', async () => {
      const uploadSpy = jest
        .spyOn(cloudinaryService, 'uploadMessageAttachment')
        .mockResolvedValueOnce({ secure_url: fakeSecureUrl });

      const res = await agentC
        .post(`/api/chats/${directChat.id}/messages`)
        .attach('image', dummyImageBuffer, 'photo.png');

      expect(res.status).toBe(201);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(res.body.data.message.text).toBeNull();
      expect(res.body.data.message.imageUrl).toBe(fakeSecureUrl);
    });

    it('should reject message creation with 400 if neither text nor image is provided', async () => {
      const uploadSpy = jest.spyOn(cloudinaryService, 'uploadMessageAttachment');

      const res = await agentA
        .post(`/api/chats/${groupChat.id}/messages`)
        .send({});

      expect(res.status).toBe(400);
      expect(uploadSpy).not.toHaveBeenCalled();
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringMatching(/either text or an attachment/i),
          }),
        ])
      );
    });

    it('should reject message creation with 400 if text is empty whitespace only and no image is attached', async () => {
      const res = await agentA
        .post(`/api/chats/${groupChat.id}/messages`)
        .field('text', '     ');

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
          }),
        ])
      );
    });

    it('should return 403 when a user tries to send a message to a chat they are not a member of', async () => {
      const res = await agentB
        .post(`/api/chats/${directChat.id}/messages`)
        .field('text', 'Intruder message');

      expect(res.status).toBe(403);
    });

    it('should return 403 when a user who has left the chat tries to send a message', async () => {
      await prisma.chatMember.updateMany({
        where: { chatId: groupChat.id, userId: userBob.id },
        data: { leftAt: new Date() },
      });

      const res = await agentB
        .post(`/api/chats/${groupChat.id}/messages`)
        .field('text', 'I should not be able to send this');

      expect(res.status).toBe(403);
    });

    it('should return 403 when sending a message to a non-existent chatId', async () => {
      const nonExistentChatId = '00000000-0000-0000-0000-000000000000';

      const res = await agentA
        .post(`/api/chats/${nonExistentChatId}/messages`)
        .field('text', 'Hello void');

      expect(res.status).toBe(403);
    });

    it('should create a message and broadcast it via socket', async () => {
      const res = await agentA
        .post(`/api/chats/${directChat.id}/messages`)
        .field('text', 'Hello world');

      expect(res.status).toBe(201);

      expect(mockIO.to).toHaveBeenCalledWith([`user:${userCharlie.id}`]);

      expect(mockIO.emit).toHaveBeenCalledWith(
        'chat_message',
        expect.objectContaining({ text: 'Hello world' })
      );
    });
  });

  describe('GET /api/chats/:chatId/messages Integration Tests', () => {

    it('should load initial messages via GET /api/chats/:chatId and paginate older messages', async () => {
      const baseTime = new Date('2026-09-01T12:00:00.000Z').getTime();
      const messageData = Array.from({ length: 45 }).map((_, index) => ({
        chatId: directChat.id,
        senderId: index % 2 === 0 ? currentUser.id : userBob.id,
        text: `Message ${index + 1}`,
        createdAt: new Date(baseTime + index * 1000),
      }));

      await prisma.message.createMany({ data: messageData });

      const chatRes = await agentA.get(`/api/chats/${directChat.id}`);
      expect(chatRes.status).toBe(200);

      const initialChat = chatRes.body.data.chat;

      expect(initialChat.messages).toHaveLength(30);
      expect(initialChat.messages[0].text).toBe('Message 16');
      expect(initialChat.messages[29].text).toBe('Message 45');

      expect(initialChat.pagination).toBeDefined();
      expect(initialChat.pagination.hasMore).toBe(true);

      const scrollCursor = initialChat.pagination.nextCursor;
      expect(scrollCursor).toBe(initialChat.messages[0].id);

      const scrollRes = await agentA.get(
        `/api/chats/${directChat.id}/messages?cursor=${scrollCursor}`
      );
      expect(scrollRes.status).toBe(200);

      const olderBatch = scrollRes.body.data.messages;
      const olderPagination = scrollRes.body.data.pagination;

      expect(olderBatch).toHaveLength(15);
      expect(olderBatch[0].text).toBe('Message 1');
      expect(olderBatch[14].text).toBe('Message 15');

      expect(olderPagination.hasMore).toBe(false);
      expect(olderPagination.nextCursor).toBeNull();

      const initialIds = new Set(initialChat.messages.map((m) => m.id));
      const hasDuplicate = olderBatch.some((m) => initialIds.has(m.id));
      expect(hasDuplicate).toBe(false);
    });

    it('should paginate backward using cursor and return the remaining older messages with hasMore: false', async () => {
      const baseTime = new Date('2026-09-01T12:00:00.000Z').getTime();
      const messageData = Array.from({ length: 35 }).map((_, index) => ({
        chatId: directChat.id,
        senderId: currentUser.id,
        text: `Message ${index + 1}`,
        createdAt: new Date(baseTime + index * 1000),
      }));

      await prisma.message.createMany({ data: messageData });

      const page1Res = await agentA.get(`/api/chats/${directChat.id}/messages`);
      expect(page1Res.status).toBe(200);
      const cursor = page1Res.body.data.pagination.nextCursor;
      expect(cursor).toBeDefined();

      const page2Res = await agentA.get(`/api/chats/${directChat.id}/messages?cursor=${cursor}`);
      expect(page2Res.status).toBe(200);

      const { messages: olderMessages, pagination } = page2Res.body.data;

      expect(olderMessages).toHaveLength(5);
      expect(olderMessages[0].text).toBe('Message 1');
      expect(olderMessages[4].text).toBe('Message 5');

      expect(pagination.hasMore).toBe(false);
      expect(pagination.nextCursor).toBeNull();

      const page1Ids = new Set(page1Res.body.data.messages.map((m) => m.id));
      const hasOverlap = olderMessages.some((m) => page1Ids.has(m.id));
      expect(hasOverlap).toBe(false);
    });

    it('should exclude messages sent before a member deleted their chat history', async () => {
      const t1 = new Date('2026-09-01T10:00:00.000Z');
      const deleteTime = new Date('2026-09-01T11:00:00.000Z');
      const t2 = new Date('2026-09-01T12:00:00.000Z');

      await prisma.message.create({
        data: {
          chatId: directChat.id,
          senderId: userBob.id,
          text: 'Old message before deletion',
          createdAt: t1,
        },
      });

      await prisma.chatMember.updateMany({
        where: { chatId: directChat.id, userId: currentUser.id },
        data: { deletedAt: deleteTime },
      });

      await prisma.message.create({
        data: {
          chatId: directChat.id,
          senderId: userBob.id,
          text: 'Fresh message after deletion',
          createdAt: t2,
        },
      });

      const res = await agentA.get(`/api/chats/${directChat.id}/messages`);
      expect(res.status).toBe(200);

      const { messages, pagination } = res.body.data;
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('Fresh message after deletion');
      expect(pagination.hasMore).toBe(false);
      expect(pagination.nextCursor).toBeNull();
    });

    it('should return 404 if user is not a member of the chat', async () => {
      const setupC = await createAuthenticatedAgent({}, { displayName: 'Charlie Test' });
      const agentC = setupC.agent;

      const res = await agentC.get(`/api/chats/${directChat.id}/messages`);
      expect(res.status).toBe(404);
    });

    it('should return 400 when cursor is not a valid UUID format', async () => {
      const nonValidCursor = 'non-valid-uuid';

      const res = await agentA.get(`/api/chats/${directChat.id}/messages?cursor=${nonValidCursor}`);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringMatching(/cursor/i),
          }),
        ])
      );
    });

    it('should return empty list with hasMore: false when chat has no messages', async () => {
      const res = await agentA.get(`/api/chats/${directChat.id}/messages`);
      expect(res.status).toBe(200);
      expect(res.body.data.messages).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        nextCursor: null,
        hasMore: false,
      });
    });
  });
});