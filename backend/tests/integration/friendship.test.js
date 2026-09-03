import request from "supertest";
import { prisma } from "../../lib/prisma.js";
import app from "../../src/app.js";
import { createAuthenticatedAgent } from "../helpers/authHelper.js";
import { createFriendship } from "../helpers/friendshipHelper.js";

describe("Friendship Routes Integration Tests", () => {
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

  describe("POST /api/friendships/requests", () => {
    
    it('should return a new friendship if no friendship exists yet', async () => {
      const res = await agentA
        .post('/api/friendships/requests')
        .send({
          receiverId: userBob.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          status: 'PENDING',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          senderId: currentUser.id,
          receiverId: userBob.id,
        }),
      );
    });

    it('should reject if friendship is already accepted', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'ACCEPTED',
      });

      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/friends/i);
    });

    it('should reject if friendship has status BLOCKED', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'BLOCKED',
      });

      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unable/i);
    });

    it('should reject if friendship has status PENDING', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });

      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/pending/i);
    });

     it('should allow request if friendship has status DECLINED', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'DECLINED',
      });

      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship.status).toBe('PENDING');
    });

    it('should reject if a pending request already exists in reverse direction', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });

      const res = await agentB
        .post('/api/friendships/requests')
        .send({ receiverId: currentUser.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/pending/i);
    });

    it('should reject if receiver has blocked current user', async () => {
      await createFriendship({
        senderId: userBob.id,
        receiverId: currentUser.id,
        status: 'BLOCKED',
      });

      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unable/i);
    });

    it('should reject when sending a request to oneself', async () => {
      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: currentUser.id });

      expect(res.status).toBe(400);
    });

    it('should reject when receiverId is not a valid UUID', async () => {
      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('should reject when receiver does not exist', async () => {
      const res = await agentA
        .post('/api/friendships/requests')
        .send({ receiverId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(400);
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/friendships/requests')
        .send({ receiverId: userBob.id });

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/friendships/:friendshipId", () => {

    it('should accept a PENDING friendship', async () => {
      const { friendship: existingFriendship } = await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });

      const res = await agentB
        .patch(`/api/friendships/${existingFriendship.id}`)
        .send({
          status: 'ACCEPTED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          status: 'ACCEPTED',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          senderId: currentUser.id,
          receiverId: userBob.id,
        }),
      );
    });

    it('should decline a PENDING friendship', async () => {
      const { friendship: existingFriendship } = await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });

      const res = await agentB
        .patch(`/api/friendships/${existingFriendship.id}`)
        .send({
          status: 'DECLINED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship.status).toBe('DECLINED');
    });

    it('should reject if a friendship request does not exist', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      const res = await agentB
        .patch(`/api/friendships/${nonExistingId}`)
        .send({
          status: 'ACCEPTED',
        });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should reject if receiverId does not match', async () => {
      const { friendship: existingFriendship } = await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });
      
      const res = await agentA
        .patch(`/api/friendships/${existingFriendship.id}`)
        .send({
          status: 'ACCEPTED',
        });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should reject if friendship status is not PENDING', async () => {
      const { friendship: existingFriendship } = await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'DECLINED',
      });
      
      const res = await agentB
        .patch(`/api/friendships/${existingFriendship.id}`)
        .send({
          status: 'ACCEPTED',
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/pending/i);
    });

    it('should reject if send status is not valid', async () => {
      const { friendship: existingFriendship } = await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });
      
      const res = await agentB
        .patch(`/api/friendships/${existingFriendship.id}`)
        .send({
          status: 'BLOCKED',
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe("POST /api/friendships/block", () => {

    it('should create a friendship with status BLOCKED', async () => {
      const res = await agentA
        .post('/api/friendships/block')
        .send({
          receiverId: userBob.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          status: 'BLOCKED',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          senderId: currentUser.id,
          receiverId: userBob.id,
        }),
      );
    });

    it('should update a existing friendship with status BLOCKED', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'ACCEPTED',
      });

      const res = await agentA
        .post('/api/friendships/block')
        .send({
          receiverId: userBob.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendship.status).toBe('BLOCKED');
    });

    it('should reject if status is BLOCKED', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'BLOCKED',
      });

      const res = await agentA
        .post('/api/friendships/block')
        .send({
          receiverId: userBob.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already/i);
    });
  });

  describe("DELETE /api/friendships/block/:reveiverId", () => {

    it('should delete a friendship with status BLOCKED', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'BLOCKED',
      });
      
      const res = await agentA
        .delete(`/api/friendships/block/${userBob.id}`)
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const dbFriendship = await prisma.friendship.findUnique({
        where: {
          senderId_receiverId: {
            senderId: currentUser.id,
            receiverId: userBob.id,
          },
        },
      });

      expect(dbFriendship).toBeNull();
    });

    it('should reject if a friendship with status BLOCKED does not exist', async () => {
      await createFriendship({
        senderId: currentUser.id,
        receiverId: userBob.id,
        status: 'PENDING',
      });
      
      const res = await agentA
        .delete(`/api/friendships/block/${userBob.id}`)
      
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should reject if senderId does not match', async () => {
      await createFriendship({
        senderId: userBob.id,
        receiverId: currentUser.id,
        status: 'BLOCKED',
      });
      
      const res = await agentA
        .delete(`/api/friendships/block/${userBob.id}`)
      
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unnable/i);
    });
  });
});