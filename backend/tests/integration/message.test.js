import { jest } from "@jest/globals";
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { cloudinaryService } from "../../src/services/cloudinaryService.js";

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
            { userId: currentUser.id, role: 'ADMIN' },
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
  });
});