import { connectDatabase, disconnectDatabase, clearDatabase } from '../config/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Game, Round } from '../models';

// Set test environment
process.env.NODE_ENV = 'test';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_TEST_URI = mongoServer.getUri();
  await connectDatabase();
  await Promise.all([User.init(), Game.init(), Round.init()]);
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

beforeEach(async () => {
  await clearDatabase();
});
