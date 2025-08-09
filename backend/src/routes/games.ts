import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { Game, Round } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/games
 * Get paginated list of games with filtering
 */
router.get('/', validateRequest({
  query: {
    userId: schemas.objectId,
    gameMode: { type: 'string', enum: ['standard', 'streak', 'duels'] },
    mapName: { type: 'string' },
    minScore: { type: 'string', pattern: /^\d+$/ },
    maxScore: { type: 'string', pattern: /^\d+$/ },
    ...schemas.pagination,
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    gameMode,
    mapName,
    minScore,
    maxScore,
    page = '1',
    limit = '20',
    sort = 'played_at',
    order = 'desc',
    startDate,
    endDate
  } = req.query as any;

  // Build filter
  const filter: any = {};
  
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  if (gameMode) {
    filter.game_mode = gameMode;
  }

  if (mapName) {
    filter.map_name = { $regex: mapName, $options: 'i' };
  }

  if (minScore || maxScore) {
    filter.total_score = {};
    if (minScore) filter.total_score.$gte = parseInt(minScore);
    if (maxScore) filter.total_score.$lte = parseInt(maxScore);
  }

  if (startDate || endDate) {
    filter.played_at = {};
    if (startDate) filter.played_at.$gte = new Date(startDate);
    if (endDate) filter.played_at.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObj: any = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  const [games, total] = await Promise.all([
    Game.find(filter)
      .select('-__v')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Game.countDocuments(filter)
  ]);

  // Get round counts for each game
  const gameIds = games.map(game => game._id);
  const roundCounts = await Round.aggregate([
    { $match: { game_id: { $in: gameIds } } },
    { $group: { _id: '$game_id', count: { $sum: 1 } } }
  ]);

  const roundCountMap = roundCounts.reduce((acc: any, item: any) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  // Add round counts to games
  const gamesWithRounds = games.map((game: any) => ({
    ...game,
    actual_round_count: roundCountMap[game._id.toString()] || 0
  }));

  res.json({
    success: true,
    data: {
      games: gamesWithRounds,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    },
    meta: {
      filters: {
        userId,
        gameMode,
        mapName,
        scoreRange: minScore || maxScore ? { min: minScore, max: maxScore } : null,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      },
      sorting: { field: sort, order }
    }
  });
}));

/**
 * GET /api/games/:id
 * Get single game with detailed information
 */
router.get('/:id', validateRequest({
  params: {
    id: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const game = await Game.findById(id).select('-__v').lean();

  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  // Get rounds for this game
  const rounds = await Round.find({ game_id: id })
    .select('-__v')
    .sort({ round_number: 1 })
    .lean();

  // Calculate additional statistics
  const totalDistance = rounds.reduce((sum, round) => sum + round.distance_km, 0);
  const avgDistance = rounds.length > 0 ? totalDistance / rounds.length : 0;
  const correctCountries = rounds.filter(round => round.is_correct_country).length;
  const countryAccuracy = rounds.length > 0 ? (correctCountries / rounds.length) * 100 : 0;

  const gameWithDetails = {
    ...game,
    rounds,
    statistics: {
      actual_round_count: rounds.length,
      total_distance_km: Math.round(totalDistance),
      avg_distance_km: Math.round(avgDistance),
      correct_countries: correctCountries,
      country_accuracy: Math.round(countryAccuracy * 10) / 10,
      perfect_scores: rounds.filter(round => round.score === 5000).length,
      countries_visited: [...new Set(rounds.map(round => round.actual_country_code).filter(Boolean))]
    }
  };

  res.json({
    success: true,
    data: gameWithDetails
  });
}));

/**
 * GET /api/games/:id/rounds
 * Get rounds for a specific game
 */
router.get('/:id/rounds', validateRequest({
  params: {
    id: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  // Verify game exists
  const game = await Game.findById(id).select('_id map_name game_mode total_score played_at');
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  const rounds = await Round.find({ game_id: id })
    .select('-__v')
    .sort({ round_number: 1 })
    .lean();

  res.json({
    success: true,
    data: {
      game: game,
      rounds: rounds
    }
  });
}));

/**
 * GET /api/games/summary
 * Get games summary statistics
 */
router.get('/summary', validateRequest({
  query: {
    userId: schemas.objectId,
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId, startDate, endDate } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  if (startDate || endDate) {
    filter.played_at = {};
    if (startDate) filter.played_at.$gte = new Date(startDate);
    if (endDate) filter.played_at.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const summary = await Game.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalScore: { $sum: '$total_score' },
        avgScore: { $avg: '$total_score' },
        maxScore: { $max: '$total_score' },
        minScore: { $min: '$total_score' },
        gameModes: { $push: '$game_mode' },
        maps: { $push: '$map_name' },
        recentGame: { $max: '$played_at' },
        firstGame: { $min: '$played_at' }
      }
    },
    {
      $project: {
        totalGames: 1,
        totalScore: 1,
        avgScore: { $round: ['$avgScore', 0] },
        maxScore: 1,
        minScore: 1,
        gameModes: 1,
        maps: 1,
        recentGame: 1,
        firstGame: 1
      }
    }
  ]);

  if (!summary.length) {
    return res.json({
      success: true,
      data: {
        totalGames: 0,
        totalScore: 0,
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        gameModeDistribution: {},
        uniqueMaps: 0,
        recentGame: null,
        firstGame: null
      }
    });
  }

  const data = summary[0];

  // Game mode distribution
  const gameModeDistribution = data.gameModes.reduce((acc: any, mode: string) => {
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});

  // Unique maps count
  const uniqueMaps = new Set(data.maps).size;

  res.json({
    success: true,
    data: {
      ...data,
      gameModeDistribution,
      uniqueMaps,
      gameModes: undefined,
      maps: undefined
    },
    meta: {
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

export default router;
