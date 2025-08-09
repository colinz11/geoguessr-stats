import dotenv from 'dotenv';
import { startServer } from './app-simple';

// Load environment variables
dotenv.config();

// Start the Express server
if (require.main === module) {
  startServer();
}
