import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from "../../lib/prisma.js";
import { createAuthenticatedAgent, createTestUser } from '../helpers/authHelper.js';

describe("Auth Routes Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user with valid data", async () => {
      const newUser = {
        username: "test",
        password: "Password123!",
        passwordConfirm: "Password123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          username: newUser.username,
          createdAt: expect.any(String),
          profile: expect.objectContaining({
            displayName: newUser.username,
            bio: expect.any(String),
          }),
        }),
      );

      expect(response.body.data.user.password).toBeUndefined();

      const dbUser = await prisma.user.findUnique({
        where: { id: response.body.data.user.id },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe(newUser.username);
    });

    it("should return 400 when required fields are missing", async () => {
      const invalidUser = {
        username: "No Credentials User",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should return 400 when password does not meet criteria", async () => {
      const weakPasswordUser = {
        username: "weak_pass_user",
        password: "123",
        passwordConfirm: "123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(weakPasswordUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 if username is already taken", async () => {
      
      await request(app).post("/api/auth/register").send({
        username: "existing_user",
        password: "Password123!",
        passwordConfirm: "Password123!",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "existing_user",
          password: "Password123!",
          passwordConfirm: "Password123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toEqual(expect.any(String));

      const dbUser = await prisma.user.findUnique({
        where: { username: "existing_user" },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe("existing_user");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should successfully login a user with valid credentials", async () => {
      const { testUser, rawPassword } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: rawPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: testUser.id,
          username: testUser.username,
          createdAt: expect.any(String),
          profile: expect.objectContaining({
            displayName: testUser.profile.displayName,
            bio: testUser.profile.bio,
          }),
        }),
      );

      expect(response.body.data.user.password).toBeUndefined();

      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/sid/);
    });

    it("should return 401 when password is incorrect", async () => {
      const { testUser } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: testUser.username,
          password: "WrongPassword!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 401 when username does not exist", async () => {
      const { rawPassword } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "non_existent_user",
          password: rawPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 when credentials are missing from payload", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should successfully log out an authenticated user", async () => {
      const { agent } = await createAuthenticatedAgent();

      const logoutRes = await agent.post("/api/auth/logout");
      
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should successfully send the current logged in user", async () => {
      const { agent, user } = await createAuthenticatedAgent();

      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toEqual(
        expect.objectContaining({
          id: user.id,
          username: user.username,
          createdAt: expect.any(String),
          profile: expect.objectContaining({
            displayName: user.profile.displayName,
            bio: user.profile.bio,
          })
        }),
      );

      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should send NULL when not logged in", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeNull();
    });
  });
});