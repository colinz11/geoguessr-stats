import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';

// Route imports
import mapRoutes from './routes/map';

// Middleware imports
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter limit for data-intensive endpoints
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded for data operations. Please try again later.'
  }
});

app.use('/api/', limiter);
app.use('/api/sync/', strictLimiter);

// General middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/map', mapRoutes); // Key endpoint for interactive world map

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'GeoGuessr Stats API',
    version: '1.0.0',
    description: 'REST API for GeoGuessr game statistics and analytics',
    endpoints: {
      map: '/api/map',
      health: '/health'
    },
    features: {
      'Interactive Map Data': '/api/map/rounds',
      'Country Performance': '/api/map/countries'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server startup
const startServer = async (port: number = parseInt(process.env.PORT || '3000')) => {
  try {
    await connectDatabase();
    console.log('✅ Database connected successfully');
    
    const server = app.listen(port, () => {
      console.log(`🚀 GeoGuessr Stats API Server running on port ${port}`);
      console.log(`📊 API available at http://localhost:${port}/api`);
      console.log(`🗺️  Map endpoints at http://localhost:${port}/api/map`);
      console.log(`🏥 Health check at http://localhost:${port}/health`);
      console.log(`\n🎯 Phase 3: Backend API Development - MVP READY!`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

export { app, startServer };
export default app;
