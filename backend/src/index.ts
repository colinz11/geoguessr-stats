import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { User, Game, Round } from './models';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    
    console.log('🚀 GeoGuessr Stats Server Starting...');
    
    // Test model creation
    console.log('📋 Testing data models...');
    
    // Log model names to verify they're loaded
    console.log('✅ Models loaded:', {
      User: User.modelName,
      Game: Game.modelName,
      Round: Round.modelName
    });
    
    // Test database connection by counting documents
    const [userCount, gameCount, roundCount] = await Promise.all([
      User.countDocuments(),
      Game.countDocuments(),
      Round.countDocuments()
    ]);
    
    console.log('📊 Current database state:', {
      users: userCount,
      games: gameCount,
      rounds: roundCount
    });
    
    console.log('✅ Data models initialized successfully!');
    console.log('🎯 Phase 1 Complete: Database models and connection working');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
