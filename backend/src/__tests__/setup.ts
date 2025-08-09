import { connectDatabase, disconnectDatabase, clearDatabase } from '../config/database';

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});
