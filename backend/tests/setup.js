import 'dotenv/config';
import { jest } from "@jest/globals";
import { resetDb } from './helpers/resetDb.js';
import { setIO } from '../src/sockets/socket.js';
import { resetMockIO } from './helpers/resetMockIO.js';

export const mockIO = {
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  fetchSockets: jest.fn().mockResolvedValue([]),
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
  resetMockIO();
});