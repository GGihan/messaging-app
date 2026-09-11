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
            { userId: userBob.id, role: 'MEMBER' },
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
});