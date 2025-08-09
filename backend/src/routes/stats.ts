import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { Round, Game, User } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/stats/overview
 * Get overall user statistics for dashboard
 */
router.get('/overview', validateRequest({
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

  // Date filtering through game join
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  // Game statistics
  const gameFilter: any = {};
  if (userId) {
    gameFilter.user_id = new mongoose.Types.ObjectId(userId);
  }
  if (Object.keys(dateFilter).length > 0) {
    gameFilter.played_at = dateFilter;
  }

  const [gameStats, roundStats] = await Promise.all([
    // Game statistics
    Game.aggregate([
      { $match: gameFilter },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalScore: { $sum: '$total_score' },
          avgScore: { $avg: '$total_score' },
          maxScore: { $max: '$total_score' },
          minScore: { $min: '$total_score' },
          gameModes: { $push: '$game_mode' }
        }
      },
      {
        $project: {
          totalGames: 1,
          totalScore: 1,
          avgScore: { $round: ['$avgScore', 0] },
          maxScore: 1,
          minScore: 1,
          gameModes: 1
        }
      }
    ]),

    // Round statistics  
    Round.aggregate([
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
          _id: null,
          totalRounds: { $sum: 1 },
          correctCountries: { $sum: { $cond: ['$is_correct_country', 1, 0] } },
          perfectScores: { $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] } },
          avgDistance: { $avg: '$distance_km' },
          totalTime: { $sum: '$time_taken' },
          countries: { $addToSet: '$actual_country_code' }
        }
      },
      {
        $project: {
          totalRounds: 1,
          correctCountries: 1,
          countryAccuracy: {
            $round: [
              { $multiply: [{ $divide: ['$correctCountries', '$totalRounds'] }, 100] }, 
              1
            ]
          },
          perfectScores: 1,
          perfectRate: {
            $round: [
              { $multiply: [{ $divide: ['$perfectScores', '$totalRounds'] }, 100] }, 
              1
            ]
          },
          avgDistance: { $round: ['$avgDistance', 0] },
          totalTime: 1,
          avgTimePerRound: { $round: [{ $divide: ['$totalTime', '$totalRounds'] }, 0] },
          uniqueCountries: { $size: '$countries' }
        }
      }
    ])
  ]);

  // Game mode distribution
  const gameModeStats = gameStats[0]?.gameModes ? 
    gameStats[0].gameModes.reduce((acc: any, mode: string) => {
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {}) : {};

  const overview = {
    games: gameStats[0] || {
      totalGames: 0,
      totalScore: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0
    },
    rounds: roundStats[0] || {
      totalRounds: 0,
      correctCountries: 0,
      countryAccuracy: 0,
      perfectScores: 0,
      perfectRate: 0,
      avgDistance: 0,
      totalTime: 0,
      avgTimePerRound: 0,
      uniqueCountries: 0
    },
    gameModes: gameModeStats
  };

  res.json({
    success: true,
    data: overview,
    meta: {
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/stats/countries
 * Get country-wise performance statistics
 */
router.get('/countries', validateRequest({
  query: {
    userId: schemas.objectId,
    sortBy: { type: 'string', enum: ['accuracy', 'avgScore', 'count', 'avgDistance'] },
    order: { type: 'string', enum: ['asc', 'desc'] },
    ...schemas.pagination,
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    sortBy = 'count',
    order = 'desc',
    page = '1',
    limit = '50',
    startDate,
    endDate
  } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const sortField = sortBy === 'count' ? 'totalRounds' : 
                   sortBy === 'accuracy' ? 'accuracy' :
                   sortBy === 'avgScore' ? 'avgScore' : 'avgDistance';

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
        totalScore: { $sum: '$score' },
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' },
        avgDistance: { $avg: '$distance_km' },
        minDistance: { $min: '$distance_km' },
        maxDistance: { $max: '$distance_km' },
        perfectScores: { $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] } },
        totalTime: { $sum: '$time_taken' }
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
        totalScore: 1,
        avgScore: { $round: ['$avgScore', 0] },
        maxScore: 1,
        minScore: 1,
        avgDistance: { $round: ['$avgDistance', 0] },
        minDistance: { $round: ['$minDistance', 0] },
        maxDistance: { $round: ['$maxDistance', 0] },
        perfectScores: 1,
        perfectRate: {
          $round: [
            { $multiply: [{ $divide: ['$perfectScores', '$totalRounds'] }, 100] }, 
            1
          ]
        },
        avgTimePerRound: { $round: [{ $divide: ['$totalTime', '$totalRounds'] }, 0] }
      }
    },
    { $sort: { [sortField]: order === 'desc' ? -1 : 1 } },
    { $skip: skip },
    { $limit: limitNum }
  ];

  // Get total count
  const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
  countPipeline.push({ $count: 'total' });

  const [countries, countResult] = await Promise.all([
    Round.aggregate(pipeline),
    Round.aggregate(countPipeline)
  ]);

  const total = countResult[0]?.total || 0;

  res.json({
    success: true,
    data: {
      countries,
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
      sortBy,
      order,
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/stats/trends
 * Get performance trends over time
 */
router.get('/trends', validateRequest({
  query: {
    userId: schemas.objectId,
    period: { type: 'string', enum: ['day', 'week', 'month'] },
    metric: { type: 'string', enum: ['score', 'accuracy', 'distance'] },
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    period = 'week',
    metric = 'score',
    startDate,
    endDate
  } = req.query as any;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter = { ...dateFilter, $gte: new Date(startDate) };
    if (endDate) dateFilter = { ...dateFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  // Date grouping format based on period
  const dateFormat = period === 'day' ? '%Y-%m-%d' :
                    period === 'week' ? '%Y-%U' :
                    '%Y-%m';

  const pipeline = [
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
    ...(Object.keys(dateFilter).length > 0 ? [{ $match: { 'game.played_at': dateFilter } }] : []),
    {
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$game.played_at' } }
        },
        totalRounds: { $sum: 1 },
        avgScore: { $avg: '$score' },
        totalScore: { $sum: '$score' },
        correctGuesses: { $sum: { $cond: ['$is_correct_country', 1, 0] } },
        avgDistance: { $avg: '$distance_km' },
        perfectScores: { $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] } },
        date: { $first: '$game.played_at' }
      }
    },
    {
      $project: {
        period: '$_id.period',
        date: 1,
        totalRounds: 1,
        avgScore: { $round: ['$avgScore', 0] },
        totalScore: 1,
        accuracy: {
          $round: [
            { $multiply: [{ $divide: ['$correctGuesses', '$totalRounds'] }, 100] }, 
            1
          ]
        },
        avgDistance: { $round: ['$avgDistance', 0] },
        perfectRate: {
          $round: [
            { $multiply: [{ $divide: ['$perfectScores', '$totalRounds'] }, 100] }, 
            1
          ]
        }
      }
    },
    { $sort: { date: 1 } }
  ];

  const trends = await Round.aggregate(pipeline);

  res.json({
    success: true,
    data: trends,
    meta: {
      period,
      metric,
      count: trends.length,
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

/**
 * GET /api/stats/accuracy
 * Get detailed accuracy metrics
 */
router.get('/accuracy', validateRequest({
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
      $bucket: {
        groupBy: '$distance_km',
        boundaries: [0, 1, 10, 50, 100, 500, 1000, 5000, 20000],
        default: 'other',
        output: {
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          perfectCount: { $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] } }
        }
      }
    },
    {
      $project: {
        range: '$_id',
        count: 1,
        avgScore: { $round: ['$avgScore', 0] },
        perfectCount: 1,
        perfectRate: {
          $round: [
            { $multiply: [{ $divide: ['$perfectCount', '$count'] }, 100] }, 
            1
          ]
        }
      }
    }
  ];

  const accuracyBuckets = await Round.aggregate(pipeline);

  // Distance distribution labels
  const rangeLabels: { [key: string]: string } = {
    '0': '0-1 km (Perfect)',
    '1': '1-10 km (Excellent)', 
    '10': '10-50 km (Great)',
    '50': '50-100 km (Good)',
    '100': '100-500 km (Fair)',
    '500': '500-1000 km (Poor)',
    '1000': '1000-5000 km (Bad)',
    '5000': '5000+ km (Terrible)',
    'other': '20000+ km (Hopeless)'
  };

  const accuracy = accuracyBuckets.map(bucket => ({
    ...bucket,
    label: rangeLabels[bucket.range.toString()] || `${bucket.range}+ km`
  }));

  res.json({
    success: true,
    data: accuracy,
    meta: {
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

export default router;
