import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent, createTestUser } from '../helpers/authHelper.js';

describe("User Routes Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Get /api/users", () => {
    let agent;
    let currentUser;
    let userAlice;
    let userBob;
    let userCelin;

    beforeEach(async () => {
      const setup = await createAuthenticatedAgent({}, { displayName: 'Test User' });
      agent = setup.agent;
      currentUser = setup.user;

      const alice = await createTestUser({}, { displayName: 'Alice Walker' });
      userAlice = alice.testUser;

      const bob = await createTestUser({}, { displayName: 'Bob Dylan' });
      userBob = bob.testUser;

      const celin = await createTestUser({}, { displayName: 'Celin Dyker' });
      userCelin = celin.testUser;
    });

    it('should return matching users for a partial search', async () => {
      const res = await agent.get('/api/users?search=ali');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0]).toEqual(
        expect.objectContaining({
          id: userAlice.id,
          username: userAlice.username,
          createdAt: expect.any(String),
          profile: expect.objectContaining({
            displayName: userAlice.profile.displayName,
            bio: userAlice.profile.bio,
          }),
        })
      );
      expect(res.body.data.users[0]).not.toHaveProperty('password');
    });

    it('should perform case-insensitive search', async () => {
      const res = await agent.get('/api/users?search=BOB');

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].profile.displayName).toBe(userBob.profile.displayName);
    });

    it('should exclude the current user from search results', async () => {
      const res = await agent.get('/api/users?search=Test');

      expect(res.status).toBe(200);
      const foundCurrent = res.body.data.users.some((u) => u.id === currentUser.id);
      expect(foundCurrent).toBe(false);
    });

    it('should return empty search results if search is omitted', async () => {
      const res = await agent.get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(0);
    });

    it('should return search results with no current user', async () => {
      const res = await request(app).get('/api/users?search=CeLin');

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0].profile.displayName).toBe(userCelin.profile.displayName);
    });
  });
});