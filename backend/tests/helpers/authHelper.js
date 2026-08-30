import bcrypt from "bcryptjs";
import signature from 'cookie-signature';
import { prisma } from "../../lib/prisma.js";
import request from "supertest";
import app from "../../src/app.js";

const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = 'sid';

export async function createAuthenticatedAgent(userOverrides = {}, profileOverrides = {}) {
  const user = await prisma.user.create({
    data: {
      username: `test_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      password: 'pre_hashed_dummy_password',
      profile: {
        create: {
          displayName: "Test User",
          bio: "Hey, I am new here!",
          ...profileOverrides,
        },
      },
      ...userOverrides,
    },
    include: {
      profile: true,
    },
  });

  // Generate a session ID and construct the Passport session payload
  const sessionId = crypto.randomUUID();
  const sessionData = {
    cookie: {
      originalMaxAge: 86400000,
      expires: new Date(Date.now() + 86400000).toISOString(),
      secure: false,
      httpOnly: true,
      path: '/',
    },
    passport: {
      user: user.id,
    },
  };

  // Save the session directly into the Prisma Session store
  await prisma.session.create({
    data: {
      id: sessionId,
      sid: sessionId,
      data: JSON.stringify(sessionData),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // Sign the session ID the exact same way express-session does: "s:<sid>.<signature>"
  const signedCookieValue = `s:${signature.sign(sessionId, SESSION_SECRET)}`;

  // Initialize Supertest agent and attach the signed cookie directly
  const agent = request.agent(app);
  agent.set('Cookie', [`${COOKIE_NAME}=${encodeURIComponent(signedCookieValue)}`]);

  return { agent, user };
};

export async function createTestUser(userOverrides = {}, profileOverrides = {}) {
  const rawPassword = "Password123!";
  const hashedPassword = await bcrypt.hash(rawPassword, 1);

  const testUser = await prisma.user.create({
    data: {
      username: `test_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      password: hashedPassword,
      profile: {
        create: {
          displayName: "Test User",
          bio: "Hey, I am new here!",
          ...profileOverrides,
        },
      },
      ...userOverrides,
    },
    include: {
      profile: true,
    },
  });

  return { testUser, rawPassword };
};