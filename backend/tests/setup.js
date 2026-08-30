import 'dotenv/config';
import { resetDb } from './helpers/resetDb.js';

// Wipe the database test data before each test to guarantee test isolation
beforeEach(async () => {
  await resetDb();
});