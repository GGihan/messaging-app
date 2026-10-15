import 'dotenv/config';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { isProduction } from './env.js';
import { prisma } from '../../lib/prisma.js';

export const sessionMiddleware = session({
  name: 'sid',
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    // enable to keep cookie-based sessions functional across Incognito
    partitioned: isProduction,
  },
});