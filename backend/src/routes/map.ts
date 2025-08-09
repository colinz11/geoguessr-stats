import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { Round, Game } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/map/rounds
 * Get all rounds with geographical data for map visualization
 * Essential for interactive world map showing actual vs guess locations
 */
router.get('/rounds', validateRequest({
  query: {
    userId: schemas.objectId,
    gameMode: { type: 'string', enum: ['standard', 'streak', 'duels'] },
    minScore: { type: 'string', pattern: /^\d+$/ },
    maxScore: { type: 'string', pattern: /^\d+$/ },
    countries: { type: 'string' }, // Comma-separated country codes
    ...schemas.dateRange,
    ...schemas.pagination
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    gameMode,
    minScore,
    maxScore,
    countries,
    startDate,
    endDate,
    page = '1',
    limit = '1000' // Higher default for map visualization
  } = req.query as any;

  // Build filter
  const filter: any = {};
  
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  if (minScore || maxScore) {
    filter.score = {};
    if (minScore) filter.score.$gte = parseInt(minScore);
    if (maxScore) filter.score.$lte = parseInt(maxScore);
  }

  if (countries) {
    const countryList = countries.split(',').map((c: string) => c.trim().toLowerCase());
    filter.actual_country_code = { $in: countryList };
  }

  // Date filtering through game join
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Aggregation pipeline for map data
  const pipeline = [
    { $match: filter },
    // Join with games for filtering and metadata
    {
      $lookup: {
        from: 'games',
        localField: 'game_id',
        foreignField: '_id',
        as: 'game'
      }
    },
    { $unwind: '$game' },
    // Apply game-level filters
    ...(gameMode ? [{ $match: { 'game.game_mode': gameMode } }] : []),
    ...(Object.keys(dateFilter).length > 0 ? [{ $match: { 'game.played_at': dateFilter } }] : []),
    // Project essential map data
    {
      $project: {
        _id: 1,
        round_number: 1,
        actual_lat: 1,
        actual_lng: 1,
        guess_lat: 1,
        guess_lng: 1,
        actual_country_code: 1,
        country_guess: 1,
        score: 1,
        distance_km: 1,
        time_taken: 1,
        is_correct_country: 1,
        game_id: 1,
        // Game metadata for tooltips
        'game.map_name': '$game.map_name',
        'game.game_mode': '$game.game_mode',
        'game.total_score': '$game.total_score',
        'game.played_at': '$game.played_at'
      }
    },
    { $sort: { 'game.played_at': -1, round_number: 1 } },
    { $skip: skip },
    { $limit: limitNum }
  ];

  const rounds = await Round.aggregate(pipeline);

  // Get total count for pagination
  const countPipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'games',
        localField: 'game_id',
        foreignField: '_id',
        as: 'game'
      }
    },
    { $unwind: '$game' },
    ...(gameMode ? [{ $match: { 'game.game_mode': gameMode } }] : []),
    ...(Object.keys(dateFilter).length > 0 ? [{ $match: { 'game.played_at': dateFilter } }] : []),
    { $count: 'total' }
  ];

  const countResult = await Round.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  res.json({
    success: true,
    data: {
      rounds,
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
        scoreRange: minScore || maxScore ? { min: minScore, max: maxScore } : null,
        countries: countries?.split(','),
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/map/heatmap
 * Get aggregated data for heatmap visualization
 * Shows density of guesses and actual locations
 */
router.get('/heatmap', validateRequest({
  query: {
    userId: schemas.objectId,
    type: { type: 'string', enum: ['actual', 'guesses', 'both'], required: true },
    resolution: { type: 'string', enum: ['high', 'medium', 'low'] },
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    type,
    resolution = 'medium',
    startDate,
    endDate
  } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  // Date filtering
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  // Grid resolution for heatmap
  const gridSize = resolution === 'high' ? 0.1 : resolution === 'medium' ? 0.5 : 1.0;

  const heatmapData: any = {};

  if (type === 'actual' || type === 'both') {
    // Aggregate actual locations
    const actualPipeline = [
      { $match: filter },
      ...(Object.keys(dateFilter).length > 0 ? [
        {
          $lookup: {
            from: 'games',
            localField: 'game_id',
            foreignField: '_id',
            as: 'game'
          }
        },
        { $unwind: '$game' },
        { $match: { 'game.played_at': dateFilter } }
      ] : []),
      {
        $group: {
          _id: {
            lat: { $round: [{ $divide: ['$actual_lat', gridSize] }] },
            lng: { $round: [{ $divide: ['$actual_lng', gridSize] }] }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          locations: {
            $push: {
              lat: '$actual_lat',
              lng: '$actual_lng',
              score: '$score',
              country: '$actual_country_code'
            }
          }
        }
      },
      {
        $project: {
          lat: { $multiply: ['$_id.lat', gridSize] },
          lng: { $multiply: ['$_id.lng', gridSize] },
          count: 1,
          avgScore: { $round: ['$avgScore', 0] },
          intensity: { $min: [{ $divide: ['$count', 10] }, 1] },
          locations: { $slice: ['$locations', 5] } // Sample locations for tooltip
        }
      },
      { $sort: { count: -1 } }
    ];

    heatmapData.actual = await Round.aggregate(actualPipeline);
  }

  if (type === 'guesses' || type === 'both') {
    // Aggregate guess locations
    const guessesPipeline = [
      { $match: filter },
      ...(Object.keys(dateFilter).length > 0 ? [
        {
          $lookup: {
            from: 'games',
            localField: 'game_id',
            foreignField: '_id',
            as: 'game'
          }
        },
        { $unwind: '$game' },
        { $match: { 'game.played_at': dateFilter } }
      ] : []),
      {
        $group: {
          _id: {
            lat: { $round: [{ $divide: ['$guess_lat', gridSize] }] },
            lng: { $round: [{ $divide: ['$guess_lng', gridSize] }] }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          avgDistance: { $avg: '$distance_km' },
          guesses: {
            $push: {
              lat: '$guess_lat',
              lng: '$guess_lng',
              score: '$score',
              distance: '$distance_km'
            }
          }
        }
      },
      {
        $project: {
          lat: { $multiply: ['$_id.lat', gridSize] },
          lng: { $multiply: ['$_id.lng', gridSize] },
          count: 1,
          avgScore: { $round: ['$avgScore', 0] },
          avgDistance: { $round: ['$avgDistance', 0] },
          intensity: { $min: [{ $divide: ['$count', 10] }, 1] },
          guesses: { $slice: ['$guesses', 5] }
        }
      },
      { $sort: { count: -1 } }
    ];

    heatmapData.guesses = await Round.aggregate(guessesPipeline);
  }

  res.json({
    success: true,
    data: heatmapData,
    meta: {
      type,
      resolution,
      gridSize,
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/map/countries
 * Get country-level performance data for choropleth map
 */
router.get('/countries', validateRequest({
  query: {
    userId: schemas.objectId,
    metric: { type: 'string', enum: ['accuracy', 'score', 'count', 'distance'] },
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    metric = 'accuracy',
    startDate,
    endDate
  } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  // Date filtering
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  const pipeline = [
    { $match: filter },
    ...(Object.keys(dateFilter).length > 0 ? [
      {
        $lookup: {
          from: 'games',
          localField: 'game_id',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
      { $match: { 'game.played_at': dateFilter } }
    ] : []),
    {
      $group: {
        _id: '$actual_country_code',
        totalRounds: { $sum: 1 },
        correctGuesses: { $sum: { $cond: ['$is_correct_country', 1, 0] } },
        avgScore: { $avg: '$score' },
        totalScore: { $sum: '$score' },
        avgDistance: { $avg: '$distance_km' },
        minDistance: { $min: '$distance_km' },
        maxDistance: { $max: '$distance_km' },
        perfectScores: { $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] } }
      }
    },
    {
      $project: {
        country_code: { $toUpper: '$_id' },
        totalRounds: 1,
        correctGuesses: 1,
        accuracy: { 
          $round: [
            { $multiply: [{ $divide: ['$correctGuesses', '$totalRounds'] }, 100] }, 
            1
          ] 
        },
        avgScore: { $round: ['$avgScore', 0] },
        totalScore: 1,
        avgDistance: { $round: ['$avgDistance', 0] },
        minDistance: { $round: ['$minDistance', 0] },
        maxDistance: { $round: ['$maxDistance', 0] },
        perfectScores: 1,
        perfectRate: {
          $round: [
            { $multiply: [{ $divide: ['$perfectScores', '$totalRounds'] }, 100] }, 
            1
          ]
        }
      }
    },
    { $sort: { [metric === 'count' ? 'totalRounds' : metric === 'accuracy' ? 'accuracy' : metric === 'score' ? 'avgScore' : 'avgDistance']: -1 } }
  ];

  const countries = await Round.aggregate(pipeline);

  res.json({
    success: true,
    data: countries,
    meta: {
      metric,
      total_countries: countries.length,
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/map/connections
 * Get guess-to-actual location connections for line visualization
 */
router.get('/connections', validateRequest({
  query: {
    userId: schemas.objectId,
    limit: { type: 'string', pattern: /^\d+$/ },
    minDistance: { type: 'string', pattern: /^\d+$/ },
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    limit = '100',
    minDistance = '0',
    startDate,
    endDate
  } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  if (minDistance && parseInt(minDistance) > 0) {
    filter.distance_km = { $gte: parseInt(minDistance) };
  }

  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  const pipeline = [
    { $match: filter },
    ...(Object.keys(dateFilter).length > 0 ? [
      {
        $lookup: {
          from: 'games',
          localField: 'game_id',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
      { $match: { 'game.played_at': dateFilter } }
    ] : []),
    {
      $project: {
        actual: {
          lat: '$actual_lat',
          lng: '$actual_lng',
          country: { $toUpper: '$actual_country_code' }
        },
        guess: {
          lat: '$guess_lat',
          lng: '$guess_lng',
          country: { $toUpper: '$country_guess' }
        },
        score: 1,
        distance_km: { $round: ['$distance_km', 0] },
        time_taken: 1,
        is_correct_country: 1,
        played_at: '$game.played_at'
      }
    },
    { $sort: { distance_km: -1 } }, // Show biggest misses first
    { $limit: parseInt(limit) }
  ];

  const connections = await Round.aggregate(pipeline);

  res.json({
    success: true,
    data: connections,
    meta: {
      count: connections.length,
      filters: {
        userId,
        minDistance: parseInt(minDistance),
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

export default router;
