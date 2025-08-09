import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { User } from '../models';
import { GeoGuessrApiClient } from '../services/geoguessrApi';
import { SyncService } from '../services/syncService';
import mongoose from 'mongoose';

const router = express.Router();

// In-memory sync status tracking
const syncStatus = new Map<string, any>();

/**
 * POST /api/sync/refresh
 * Trigger manual data refresh for a user
 */
router.post('/refresh', validateRequest({
  body: {
    userId: schemas.objectId,
    maxPages: { type: 'number', min: 1, max: 50 }
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId, maxPages = 5 } = req.body;

  // Check if sync is already in progress
  if (syncStatus.has(userId)) {
    return res.status(409).json({
      success: false,
      error: 'Sync already in progress',
      message: 'Please wait for the current sync to complete',
      status: syncStatus.get(userId)
    });
  }

  // Get user with cookies
  const user = await User.findById(userId).select('+geoguessr_cookies');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (!user.geoguessr_cookies?.session_cookie) {
    return res.status(400).json({
      success: false,
      error: 'No valid session cookies found',
      message: 'Please update your GeoGuessr session cookies'
    });
  }

  // Initialize sync status
  const initialStatus = {
    status: 'starting',
    startTime: new Date(),
    progress: {
      phase: 'initialization',
      pagesProcessed: 0,
      totalPages: 0,
      gamesProcessed: 0,
      newGames: 0,
      updatedGames: 0,
      errors: []
    }
  };

  syncStatus.set(userId, initialStatus);

  // Start sync asynchronously
  const apiClient = new GeoGuessrApiClient({
    sessionCookie: user.geoguessr_cookies.session_cookie
  });

  const syncService = new SyncService(apiClient, user);

  // Run sync in background
  setImmediate(async () => {
    try {
      // Update status
      syncStatus.set(userId, {
        ...syncStatus.get(userId),
        status: 'running',
        progress: {
          ...syncStatus.get(userId).progress,
          phase: 'fetching_games'
        }
      });

      const result = await syncService.syncAllData(maxPages);

      // Update final status
      syncStatus.set(userId, {
        ...syncStatus.get(userId),
        status: result.success ? 'completed' : 'failed',
        endTime: new Date(),
        result,
        progress: {
          phase: 'completed',
          pagesProcessed: maxPages,
          gamesProcessed: result.gamesProcessed,
          newGames: result.newGames,
          updatedGames: result.updatedGames,
          errors: result.errors
        }
      });

      // Update user's last sync time
      await User.findByIdAndUpdate(userId, {
        last_sync: new Date()
      });

      // Clean up status after 1 hour
      setTimeout(() => {
        syncStatus.delete(userId);
      }, 60 * 60 * 1000);

    } catch (error: any) {
      syncStatus.set(userId, {
        ...syncStatus.get(userId),
        status: 'failed',
        endTime: new Date(),
        error: error.message,
        progress: {
          ...syncStatus.get(userId).progress,
          phase: 'failed'
        }
      });

      // Clean up status after 1 hour
      setTimeout(() => {
        syncStatus.delete(userId);
      }, 60 * 60 * 1000);
    }
  });

  res.json({
    success: true,
    message: 'Sync started successfully',
    data: {
      syncId: userId,
      status: 'started',
      maxPages,
      checkStatusUrl: `/api/sync/status/${userId}`
    }
  });
}));

/**
 * GET /api/sync/status/:userId
 * Get sync status for a user
 */
router.get('/status/:userId', validateRequest({
  params: {
    userId: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;

  const status = syncStatus.get(userId);

  if (!status) {
    // Check user's last sync time
    const user = await User.findById(userId).select('last_sync');
    
    return res.json({
      success: true,
      data: {
        status: 'idle',
        lastSync: user?.last_sync || null,
        message: 'No active sync in progress'
      }
    });
  }

  res.json({
    success: true,
    data: status
  });
}));

/**
 * POST /api/sync/cancel/:userId
 * Cancel ongoing sync for a user
 */
router.post('/cancel/:userId', validateRequest({
  params: {
    userId: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;

  const status = syncStatus.get(userId);

  if (!status) {
    return res.status(404).json({
      success: false,
      error: 'No active sync found',
      message: 'There is no sync in progress for this user'
    });
  }

  if (status.status === 'completed' || status.status === 'failed') {
    return res.status(400).json({
      success: false,
      error: 'Sync already finished',
      message: 'Cannot cancel a sync that has already completed'
    });
  }

  // Mark as cancelled
  syncStatus.set(userId, {
    ...status,
    status: 'cancelled',
    endTime: new Date(),
    progress: {
      ...status.progress,
      phase: 'cancelled'
    }
  });

  // Clean up after 5 minutes
  setTimeout(() => {
    syncStatus.delete(userId);
  }, 5 * 60 * 1000);

  res.json({
    success: true,
    message: 'Sync cancelled successfully',
    data: {
      status: 'cancelled',
      finalStatus: syncStatus.get(userId)
    }
  });
}));

/**
 * GET /api/sync/history/:userId
 * Get sync history for a user
 */
router.get('/history/:userId', validateRequest({
  params: {
    userId: schemas.objectId
  },
  query: {
    ...schemas.pagination
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;
  const { page = '1', limit = '10' } = req.query as any;

  const user = await User.findById(userId).select('last_sync created_at');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // For now, return basic info. In a full implementation, 
  // you'd store sync history in a separate collection
  const history = [
    {
      id: 'latest',
      timestamp: user.last_sync,
      status: 'completed',
      type: 'manual',
      duration: null, // Would be stored in real implementation
      gamesProcessed: null,
      errors: []
    }
  ].filter(h => h.timestamp);

  res.json({
    success: true,
    data: {
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length,
        pages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  });
}));

/**
 * POST /api/sync/test
 * Test API connection without syncing data
 */
router.post('/test', validateRequest({
  body: {
    userId: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.body;

  const user = await User.findById(userId).select('+geoguessr_cookies');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (!user.geoguessr_cookies?.session_cookie) {
    return res.status(400).json({
      success: false,
      error: 'No session cookies found',
      message: 'Please update your GeoGuessr session cookies'
    });
  }

  try {
    const apiClient = new GeoGuessrApiClient({
      sessionCookie: user.geoguessr_cookies.session_cookie
    });

    const connectionTest = await apiClient.testConnection();

    if (connectionTest) {
      res.json({
        success: true,
        message: 'API connection successful',
        data: {
          status: 'connected',
          timestamp: new Date(),
          cookieValid: true
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'API connection failed',
        message: 'Session cookies may be expired or invalid',
        data: {
          status: 'disconnected',
          timestamp: new Date(),
          cookieValid: false
        }
      });
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      message: error.message,
      data: {
        status: 'error',
        timestamp: new Date(),
        cookieValid: false
      }
    });
  }
}));

export default router;
