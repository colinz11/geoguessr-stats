import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import { User } from '../models';
import { GeoGuessrApiClient } from '../services/geoguessrApi';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with GeoGuessr session cookies
 */
router.post('/login', validateRequest({
  body: {
    username: { type: 'string', required: true },
    sessionCookie: { type: 'string', required: true },
    geoguessrUserId: { type: 'string' }
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { username, sessionCookie, geoguessrUserId } = req.body;

  try {
    // Test the session cookie
    const apiClient = new GeoGuessrApiClient({ sessionCookie });
    const isValid = await apiClient.testConnection();

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session cookie',
        message: 'The provided session cookie is not valid or has expired'
      });
    }

    // Try to get user info from API if geoguessrUserId not provided
    let userId = geoguessrUserId;
    if (!userId) {
      try {
        const feed = await apiClient.getFeed(1);
        if (feed.entries.length > 0) {
          userId = feed.entries[0].user.id;
        }
      } catch (error) {
        // If we can't get user ID from feed, we'll still allow login
        console.warn('Could not extract user ID from feed:', error);
      }
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { username: username },
        ...(userId ? [{ geoguessr_user_id: userId }] : [])
      ]
    });

    if (user) {
      // Update existing user
      user.geoguessr_cookies = {
        session_cookie: sessionCookie,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      if (userId && !user.geoguessr_user_id) {
        user.geoguessr_user_id = userId;
      }
      await user.save();
    } else {
      // Create new user
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID required',
          message: 'Could not determine GeoGuessr user ID. Please provide it manually.'
        });
      }

      user = new User({
        username,
        geoguessr_user_id: userId,
        geoguessr_cookies: {
          session_cookie: sessionCookie,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      await user.save();
    }

    // Return user info (excluding sensitive data)
    const userResponse = {
      id: user._id,
      username: user.username,
      geoguessr_user_id: user.geoguessr_user_id,
      created_at: user.created_at,
      last_sync: user.last_sync,
      session_valid: true
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        sessionValid: true
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
}));

/**
 * POST /api/auth/validate-cookies
 * Validate stored session cookies
 */
router.post('/validate-cookies', validateRequest({
  body: {
    userId: { type: 'string', required: true }
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
      message: 'Please login again to update your session cookies'
    });
  }

  try {
    const apiClient = new GeoGuessrApiClient({
      sessionCookie: user.geoguessr_cookies.session_cookie
    });

    const isValid = await apiClient.testConnection();

    res.json({
      success: true,
      data: {
        valid: isValid,
        expires_at: user.geoguessr_cookies.expires_at,
        last_validated: new Date()
      }
    });

  } catch (error: any) {
    res.json({
      success: true,
      data: {
        valid: false,
        error: error.message,
        last_validated: new Date()
      }
    });
  }
}));

/**
 * GET /api/auth/profile/:userId
 * Get user profile with statistics
 */
router.get('/profile/:userId', validateRequest({
  params: {
    userId: { type: 'string', required: true }
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get basic game statistics
  const { Game, Round } = await import('../models');
  
  const [gameCount, roundCount, lastGame] = await Promise.all([
    Game.countDocuments({ user_id: userId }),
    Round.countDocuments({ user_id: userId }),
    Game.findOne({ user_id: userId }).sort({ played_at: -1 }).select('played_at total_score map_name')
  ]);

  const profile = {
    id: user._id,
    username: user.username,
    geoguessr_user_id: user.geoguessr_user_id,
    created_at: user.created_at,
    last_sync: user.last_sync,
    statistics: {
      total_games: gameCount,
      total_rounds: roundCount,
      last_game: lastGame ? {
        played_at: lastGame.played_at,
        score: lastGame.total_score,
        map: lastGame.map_name
      } : null
    }
  };

  res.json({
    success: true,
    data: profile
  });
}));

/**
 * POST /api/auth/logout
 * Clear stored session data
 */
router.post('/logout', validateRequest({
  body: {
    userId: { type: 'string', required: true }
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Clear session cookies (optional - you might want to keep them)
  // user.geoguessr_cookies = undefined;
  // await user.save();

  res.json({
    success: true,
    message: 'Logout successful',
    data: {
      userId: user._id,
      username: user.username
    }
  });
}));

/**
 * PUT /api/auth/update-cookies
 * Update session cookies for existing user
 */
router.put('/update-cookies', validateRequest({
  body: {
    userId: { type: 'string', required: true },
    sessionCookie: { type: 'string', required: true }
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId, sessionCookie } = req.body;

  // Test the new session cookie
  try {
    const apiClient = new GeoGuessrApiClient({ sessionCookie });
    const isValid = await apiClient.testConnection();

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session cookie',
        message: 'The provided session cookie is not valid or has expired'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update cookies
    user.geoguessr_cookies = {
      session_cookie: sessionCookie,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    await user.save();

    res.json({
      success: true,
      message: 'Session cookies updated successfully',
      data: {
        userId: user._id,
        expires_at: user.geoguessr_cookies.expires_at,
        updated_at: new Date()
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Cookie update failed',
      message: error.message
    });
  }
}));

export default router;
