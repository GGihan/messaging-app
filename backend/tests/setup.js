import 'dotenv/config';
import { jest } from "@jest/globals";
import { resetDb } from './helpers/resetDb.js';
import { setIO } from '../src/sockets/socket.js';

export const mockIO = {
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
};

beforeAll(() => {
  setIO(mockIO);
});

afterAll(() => {
  setIO(null);
});

// Wipe the database test data before each test to guarantee test isolation
beforeEach(async () => {
  await resetDb();
  mockIO.to.mockClear();
  mockIO.emit.mockClear();
});