import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  uri: string;
  options: ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const isTest = process.env.NODE_ENV === 'test';
  const uri = isTest 
    ? process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/geoguessr-stats-test'
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/geoguessr-stats';

  const options: ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  return { uri, options };
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const { uri, options } = getDatabaseConfig();
    
    await mongoose.connect(uri, options);
    
    console.log(`✅ MongoDB connected: ${uri.split('@')[1] || uri}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

export const clearDatabase = async (): Promise<void> => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Database clearing is only allowed in test environment');
  }
  
  try {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map(collection => collection.deleteMany({})));
    console.log('🧹 Test database cleared');
  } catch (error) {
    console.error('❌ Error clearing test database:', error);
    throw error;
  }
};
