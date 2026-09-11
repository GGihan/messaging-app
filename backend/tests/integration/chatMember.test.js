import { expect, jest } from "@jest/globals";
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";

describe("ChatMember Routes Integration Tests", () => {
  let agentA;
  let agentB;
  let agentC;
  let agentD;
  let agentE;
  let currentUser;
  let userBob;
  let userCharlie;
  let userDavid;
  let userEve;
  let groupChat;
  
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

    const setupD = await createAuthenticatedAgent({}, { displayName: 'David Test' });
    agentD = setupD.agent;
    userDavid = setupD.user;

    const setupE = await createAuthenticatedAgent({}, { displayName: 'Eve Test' });
    agentE = setupE.agent;
    userEve = setupE.user;

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/chats/:chatId/members", () => {
    
    it('should add new users to group chat and return new members', async () => {
      const userIds = [ userDavid.id, userEve.id ];

      const res = await agentA
        .post(`/api/chats/${groupChat.id}/members`)
        .send({ userIds })

      const { addedMembers } = res.body.data;

      expect(res.status).toBe(201);
      expect(addedMembers.length).toBe(2);
      expect(addedMembers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: userDavid.id, role: 'MEMBER' }),
          expect.objectContaining({ userId: userEve.id, role: 'MEMBER' }),
        ])
      );

      const memberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(memberCount).toBe(5);
    });

    it('should skip adding existing members to group chat', async () => {
      const userIds = [ userCharlie.id, userDavid.id ];

      const res = await agentA
        .post(`/api/chats/${groupChat.id}/members`)
        .send({ userIds })

      const { addedMembers } = res.body.data;

      expect(res.status).toBe(201);
      expect(addedMembers.length).toBe(1);
      expect(addedMembers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: userDavid.id, role: 'MEMBER' }),
        ])
      );
      
      const memberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(memberCount).toBe(4);
    });

    it('should update existing members leftAt to null', async () => {
      const userIds = [ userCharlie.id ];

      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: userCharlie.id,
            chatId: groupChat.id,
          },
        },
        data: {
          leftAt: new Date(Date.now()),
        },
      });

      const res = await agentA
        .post(`/api/chats/${groupChat.id}/members`)
        .send({ userIds })

      const { addedMembers } = res.body.data;

      expect(res.status).toBe(201);
      expect(addedMembers.length).toBe(1);
      expect(addedMembers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            userId: userCharlie.id,
            role: 'MEMBER',
            leftAt: null,
          }),
        ]),
      );
      
      const memberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(memberCount).toBe(3);
    });

    it('should not allow MEMBER to add members', async () => {
      const userIds = [ userDavid.id, userEve.id ];

      const res = await agentB
        .post(`/api/chats/${groupChat.id}/members`)
        .send({ userIds })

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/admin/i)

      const memberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(memberCount).toBe(3);
    });
  });

  describe("DELETE /api/chats/:chatId/members/me", () => {
    it("should allow an active regular member to leave the group chat", async () => {
      const res = await agentB.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/left/i);
      expect(res.body.data.member).toEqual(
        expect.objectContaining({
          userId: userBob.id,
          chatId: groupChat.id,
          leftAt: expect.any(String),
        })
      );

      const memberInDb = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: userBob.id,
            chatId: groupChat.id,
          },
        },
      });
      expect(memberInDb.leftAt).not.toBeNull();

      const activeMemberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(activeMemberCount).toBe(2);
    });

    it("should return 400 if user tries to leave a chat they already left", async () => {
      await agentB.delete(`/api/chats/${groupChat.id}/members/me`);

      const res = await agentB.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already left/i);
    });

    it("should return 404 if user was never a member of the chat", async () => {
      const res = await agentD.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not a member/i);
    });

    it("should return 400 when attempting to leave a 1-on-1 direct message", async () => {
      const directMessageChat = await prisma.chat.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: currentUser.id, role: 'MEMBER' },
              { userId: userBob.id, role: 'MEMBER' },
            ],
          },
        },
      });

      const res = await agentA.delete(
        `/api/chats/${directMessageChat.id}/members/me`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/direct chat/i);

      const memberInDb = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: currentUser.id,
            chatId: directMessageChat.id,
          },
        },
      });
      expect(memberInDb.leftAt).toBeNull();
    });

    it("should promote the oldest active member to ADMIN when the sole ADMIN leaves", async () => {
      const res = await agentA.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member).toEqual(
        expect.objectContaining({
          userId: currentUser.id,
          leftAt: expect.any(String),
        })
      );

      const promotedMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: userBob.id,
            chatId: groupChat.id,
          },
        },
      });
      expect(promotedMember.role).toBe("ADMIN");

      const regularMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: userCharlie.id,
            chatId: groupChat.id,
          },
        },
      });
      expect(regularMember.role).toBe("MEMBER");

      const adminCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          role: "ADMIN",
          leftAt: null,
        },
      });
      expect(adminCount).toBe(1);
    });

    it("should allow an ADMIN to leave without promoting anyone if another ADMIN exists", async () => {
      await prisma.chatMember.update({
        where: {
          userId_chatId: {
            userId: userBob.id,
            chatId: groupChat.id,
          },
        },
        data: { role: "ADMIN" },
      });

      const res = await agentA.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const charlieMember = await prisma.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: userCharlie.id,
            chatId: groupChat.id,
          },
        },
      });
      expect(charlieMember.role).toBe("MEMBER");

      const remainingAdmins = await prisma.chatMember.findMany({
        where: {
          chatId: groupChat.id,
          role: "ADMIN",
          leftAt: null,
        },
      });
      expect(remainingAdmins).toHaveLength(1);
      expect(remainingAdmins[0].userId).toBe(userBob.id);
    });

    it("should allow the sole ADMIN to leave if they are the only person left in the chat", async () => {
      await prisma.chatMember.updateMany({
        where: {
          chatId: groupChat.id,
          userId: { in: [userBob.id, userCharlie.id] },
        },
        data: { leftAt: new Date() },
      });

      const res = await agentA.delete(`/api/chats/${groupChat.id}/members/me`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const activeMemberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(activeMemberCount).toBe(0);
    });

    it("should update the parent chat updatedAt timestamp when a member leaves", async () => {
      const originalChat = await prisma.chat.findUnique({
        where: { id: groupChat.id },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await agentB.delete(`/api/chats/${groupChat.id}/members/me`);

      const updatedChat = await prisma.chat.findUnique({
        where: { id: groupChat.id },
      });

      expect(new Date(updatedChat.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalChat.updatedAt).getTime()
      );
    });
  });

  describe("DELETE /api/chats/:chatId/members/:memberId", () => {
    let bobMembership;
    let charlieMembership;
    let adminMembership;

    beforeEach(async () => {
      const members = await prisma.chatMember.findMany({
        where: { chatId: groupChat.id },
      });

      adminMembership = members.find((m) => m.userId === currentUser.id);
      bobMembership = members.find((m) => m.userId === userBob.id);
      charlieMembership = members.find((m) => m.userId === userCharlie.id);
    });

    it("should allow an active ADMIN to remove a MEMBER from the chat", async () => {
      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${bobMembership.id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/removed/i);
      expect(res.body.data.member).toEqual(
        expect.objectContaining({
          id: bobMembership.id,
          userId: userBob.id,
          chatId: groupChat.id,
          leftAt: expect.any(String),
        })
      );

      const updatedBob = await prisma.chatMember.findUnique({
        where: { id: bobMembership.id },
      });
      expect(updatedBob.leftAt).not.toBeNull();

      const activeMemberCount = await prisma.chatMember.count({
        where: {
          chatId: groupChat.id,
          leftAt: null,
        },
      });
      expect(activeMemberCount).toBe(2);
    });

    it("should not allow a regular MEMBER to remove another member (403)", async () => {
      const res = await agentB.delete(
        `/api/chats/${groupChat.id}/members/${charlieMembership.id}`
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      const charlieInDb = await prisma.chatMember.findUnique({
        where: { id: charlieMembership.id },
      });
      expect(charlieInDb.leftAt).toBeNull();
    });

    it("should not allow an admin who already left to remove members (403)", async () => {
      await prisma.chatMember.update({
        where: { id: adminMembership.id },
        data: { leftAt: new Date() },
      });

      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${bobMembership.id}`
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 if an ADMIN attempts to remove themselves via this endpoint", async () => {
      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${adminMembership.id}`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot remove yourself/i);
    });

    it("should return 400 if attempting to remove a member who has already left", async () => {
      await prisma.chatMember.update({
        where: { id: bobMembership.id },
        data: { leftAt: new Date() },
      });

      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${bobMembership.id}`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already left/i);
    });

    it("should return 404 if memberId does not exist", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${nonExistentId}`
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/member not found/i);
    });

    it("should return 404 if member belongs to a different chat", async () => {
      const otherChat = await prisma.chat.create({
        data: {
          isGroup: true,
          members: {
            create: [{ userId: userDavid.id, role: "MEMBER" }],
          },
        },
        include: { members: true },
      });
      const davidOtherChatMember = otherChat.members[0];

      const res = await agentA.delete(
        `/api/chats/${groupChat.id}/members/${davidOtherChatMember.id}`
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/member not found/i);
    });

    it("should return 400 when attempting to remove a member from a direct chat", async () => {
      const dmChat = await prisma.chat.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: currentUser.id, role: 'ADMIN' },
              { userId: userBob.id, role: 'MEMBER' },
            ],
          },
        },
        include: { members: true },
      });

      const bobMember = dmChat.members.find((m) => m.userId === userBob.id);

      const res = await agentA.delete(
        `/api/chats/${dmChat.id}/members/${bobMember.id}`
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/direct chat/i);
    });

    it("should update the parent chat updatedAt timestamp on removal", async () => {
      const originalChat = await prisma.chat.findUnique({
        where: { id: groupChat.id },
      });

      // Brief pause to ensure timestamp advances
      await new Promise((resolve) => setTimeout(resolve, 50));

      await agentA.delete(
        `/api/chats/${groupChat.id}/members/${bobMembership.id}`
      );

      const updatedChat = await prisma.chat.findUnique({
        where: { id: groupChat.id },
      });

      expect(new Date(updatedChat.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalChat.updatedAt).getTime()
      );
    });
  });
});