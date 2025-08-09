import express, { Request, Response } from 'express';
import { Game, Round, User } from '../models';
import { GeoGuessrApiClient } from '../services/geoguessrApi';
import { SyncService } from '../services/syncService';

const router = express.Router();

// In-memory sync status tracking
let syncStatus = {
  isRunning: false,
  progress: 0,
  message: '',
  lastSync: null as string | null,
  error: null as string | null
};

/**
 * @route POST /api/sync/refresh
 * @desc Refresh all game data for a user
 * @access Public (for demo)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (syncStatus.isRunning) {
    return res.status(409).json({
      success: false,
      message: 'Sync already in progress',
      data: syncStatus
    });
  }

  try {
    syncStatus = {
      isRunning: true,
      progress: 0,
      message: 'Starting sync...',
      lastSync: null,
      error: null
    };

    // Get initial counts
    const initialGameCount = await Game.countDocuments(userId ? { user_id: userId } : {});
    const initialRoundCount = await Round.countDocuments(userId ? { user_id: userId } : {});

    syncStatus.progress = 10;
    syncStatus.message = 'Finding user and session...';

    // Find user with valid session (for demo, use the first user with valid session)
    let user;
    if (userId) {
      user = await User.findById(userId).select('+geoguessr_cookies');
    } else {
      // For demo, find any user with valid session
      user = await User.findOne({
        'geoguessr_cookies.session_cookie': { $exists: true, $ne: null }
      }).select('+geoguessr_cookies');
    }

    if (!user || !user.geoguessr_cookies?.session_cookie) {
      throw new Error('No user found with valid GeoGuessr session');
    }

    syncStatus.progress = 20;
    syncStatus.message = 'Initializing GeoGuessr API client...';

    // Initialize API client
    const apiClient = new GeoGuessrApiClient({
      sessionCookie: user.geoguessr_cookies.session_cookie
    });

    // Test connection
    const connectionTest = await apiClient.testConnection();
    if (!connectionTest) {
      throw new Error('Failed to connect to GeoGuessr API');
    }

    syncStatus.progress = 30;
    syncStatus.message = 'Starting data sync with pagination...';

    // Initialize sync service
    const syncService = new SyncService(apiClient, user);

    // Run full sync, paginate until end unless a limit is provided
    const maxPages = req.body.maxPages; // Undefined means no manual limit

    // Progress callback to update sync status
    const progressCallback = (progress: number, message: string) => {
      syncStatus.progress = progress;
      syncStatus.message = message;
    };

    const syncResult = await syncService.syncAllData(maxPages, progressCallback);

    if (!syncResult.success) {
      throw new Error(`Sync failed: ${syncResult.errors.join(', ')}`);
    }

    // Get final counts
    const finalGameCount = await Game.countDocuments(userId ? { user_id: userId } : {});
    const finalRoundCount = await Round.countDocuments(userId ? { user_id: userId } : {});

    const gamesAdded = finalGameCount - initialGameCount;
    const roundsAdded = finalRoundCount - initialRoundCount;

    syncStatus = {
      isRunning: false,
      progress: 100,
      message: 'Sync completed successfully',
      lastSync: new Date().toISOString(),
      error: null
    };

    return res.json({
      success: true,
      message: 'Data sync completed successfully',
      data: {
        gamesAdded,
        roundsAdded,
        totalGames: finalGameCount,
        totalRounds: finalRoundCount
      }
    });

  } catch (error) {
    syncStatus = {
      isRunning: false,
      progress: 0,
      message: 'Sync failed',
      lastSync: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    console.error('Sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/sync/status
 * @desc Get current sync status
 * @access Public
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: syncStatus
  });
});

/**
 * @route POST /api/sync/cancel
 * @desc Cancel ongoing sync operation
 * @access Public
 */
router.post('/cancel', async (req: Request, res: Response) => {
  if (!syncStatus.isRunning) {
    return res.status(400).json({
      success: false,
      message: 'No sync operation in progress'
    });
  }

  syncStatus = {
    isRunning: false,
    progress: 0,
    message: 'Sync cancelled by user',
    lastSync: syncStatus.lastSync,
    error: 'Cancelled by user'
  };

  return res.json({
    success: true,
    message: 'Sync operation cancelled',
    data: syncStatus
  });
});

/**
 * @route GET /api/sync
 * @desc Get sync information and available endpoints
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'GeoGuessr Data Sync API',
    endpoints: {
      refresh: 'POST /api/sync/refresh',
      status: 'GET /api/sync/status',
      cancel: 'POST /api/sync/cancel'
    },
    currentStatus: syncStatus,
    usage: {
      refresh: 'Sync all game data for a user',
      status: 'Get current sync progress and status',
      cancel: 'Cancel an ongoing sync operation'
    }
  });
});

export default router;