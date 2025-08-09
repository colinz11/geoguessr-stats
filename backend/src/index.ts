import dotenv from 'dotenv';
import { startServer } from './app';

// Load environment variables
dotenv.config();

// Start the Express server
if (require.main === module) {
  startServer();
}
