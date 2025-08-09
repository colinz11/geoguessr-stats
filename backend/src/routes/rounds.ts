import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { Round, Game } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/rounds
 * Get paginated list of rounds with filtering
 */
router.get('/', validateRequest({
  query: {
    userId: schemas.objectId,
    gameId: schemas.objectId,
    country: { type: 'string' },
    correctCountry: { type: 'string', enum: ['true', 'false'] },
    minScore: { type: 'string', pattern: /^\d+$/ },
    maxScore: { type: 'string', pattern: /^\d+$/ },
    minDistance: { type: 'string', pattern: /^\d+$/ },
    maxDistance: { type: 'string', pattern: /^\d+$/ },
    ...schemas.pagination,
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    gameId,
    country,
    correctCountry,
    minScore,
    maxScore,
    minDistance,
    maxDistance,
    page = '1',
    limit = '50',
    sort = 'created_at',
    order = 'desc',
    startDate,
    endDate
  } = req.query as any;

  // Build filter
  const filter: any = {};
  
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId);
  }

  if (gameId) {
    filter.game_id = new mongoose.Types.ObjectId(gameId);
  }

  if (country) {
    filter.actual_country_code = country.toLowerCase();
  }

  if (correctCountry) {
    filter.is_correct_country = correctCountry === 'true';
  }

  if (minScore || maxScore) {
    filter.score = {};
    if (minScore) filter.score.$gte = parseInt(minScore);
    if (maxScore) filter.score.$lte = parseInt(maxScore);
  }

  if (minDistance || maxDistance) {
    filter.distance_km = {};
    if (minDistance) filter.distance_km.$gte = parseInt(minDistance);
    if (maxDistance) filter.distance_km.$lte = parseInt(maxDistance);
  }

  // Date filtering through game join
  let gameFilter = {};
  if (startDate || endDate) {
    gameFilter = {};
    if (startDate) gameFilter = { ...gameFilter, $gte: new Date(startDate) };
    if (endDate) gameFilter = { ...gameFilter, $lte: new Date(endDate + 'T23:59:59.999Z') };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObj: any = {};
  sortObj[sort] = order === 'desc' ? -1 : 1;

  let pipeline: any[] = [
    { $match: filter }
  ];

  // Add game join for date filtering
  if (Object.keys(gameFilter).length > 0) {
    pipeline.push(
      {
        $lookup: {
          from: 'games',
          localField: 'game_id',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
      { $match: { 'game.played_at': gameFilter } }
    );
  }

  // Add game info for response
  if (Object.keys(gameFilter).length === 0) {
    pipeline.push(
      {
        $lookup: {
          from: 'games',
          localField: 'game_id',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' }
    );
  }

  // Project fields
  pipeline.push(
    {
      $project: {
        _id: 1,
        round_number: 1,
        actual_lat: 1,
        actual_lng: 1,
        guess_lat: 1,
        guess_lng: 1,
        actual_country_code: { $toUpper: '$actual_country_code' },
        country_guess: { $toUpper: '$country_guess' },
        score: 1,
        distance_km: { $round: ['$distance_km', 0] },
        distance_meters: { $round: ['$distance_meters', 0] },
        time_taken: 1,
        is_correct_country: 1,
        game_id: 1,
        created_at: 1,
        // Game info
        game: {
          _id: '$game._id',
          map_name: '$game.map_name',
          game_mode: '$game.game_mode',
          total_score: '$game.total_score',
          played_at: '$game.played_at'
        }
      }
    },
    { $sort: sortObj },
    { $skip: skip },
    { $limit: limitNum }
  );

  // Get total count
  const countPipeline = [
    { $match: filter }
  ];

  if (Object.keys(gameFilter).length > 0) {
    countPipeline.push(
      {
        $lookup: {
          from: 'games',
          localField: 'game_id',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
      { $match: { 'game.played_at': gameFilter } }
    );
  }

  countPipeline.push({ $count: 'total' });

  const [rounds, countResult] = await Promise.all([
    Round.aggregate(pipeline),
    Round.aggregate(countPipeline)
  ]);

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
        gameId,
        country,
        correctCountry: correctCountry === 'true' ? true : correctCountry === 'false' ? false : null,
        scoreRange: minScore || maxScore ? { min: minScore, max: maxScore } : null,
        distanceRange: minDistance || maxDistance ? { min: minDistance, max: maxDistance } : null,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      },
      sorting: { field: sort, order }
    }
  });
}));

/**
 * GET /api/rounds/:id
 * Get single round with detailed information
 */
router.get('/:id', validateRequest({
  params: {
    id: schemas.objectId
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const roundPipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: 'games',
        localField: 'game_id',
        foreignField: '_id',
        as: 'game'
      }
    },
    { $unwind: '$game' },
    {
      $project: {
        _id: 1,
        round_number: 1,
        actual_lat: 1,
        actual_lng: 1,
        guess_lat: 1,
        guess_lng: 1,
        actual_country_code: { $toUpper: '$actual_country_code' },
        country_guess: { $toUpper: '$country_guess' },
        score: 1,
        distance_km: 1,
        distance_meters: 1,
        time_taken: 1,
        is_correct_country: 1,
        pano_id: 1,
        heading: 1,
        pitch: 1,
        zoom: 1,
        created_at: 1,
        updated_at: 1,
        game: {
          _id: '$game._id',
          game_token: '$game.game_token',
          map_name: '$game.map_name',
          game_mode: '$game.game_mode',
          total_score: '$game.total_score',
          round_count: '$game.round_count',
          played_at: '$game.played_at'
        }
      }
    }
  ];

  const result = await Round.aggregate(roundPipeline);

  if (!result.length) {
    return res.status(404).json({
      success: false,
      error: 'Round not found',
      timestamp: new Date().toISOString()
    });
  }

  const round = result[0];

  res.json({
    success: true,
    data: round
  });
}));

/**
 * GET /api/rounds/analysis
 * Get detailed analysis of rounds performance
 */
router.get('/analysis', validateRequest({
  query: {
    userId: schemas.objectId,
    type: { type: 'string', enum: ['distance', 'score', 'time', 'country'] },
    ...schemas.dateRange
  }
}), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId, type = 'distance', startDate, endDate } = req.query as any;

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

  let analysis: any = {};

  switch (type) {
    case 'distance':
      analysis = await Round.aggregate([
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
              avgTime: { $avg: '$time_taken' }
            }
          }
        },
        {
          $project: {
            range: '$_id',
            count: 1,
            avgScore: { $round: ['$avgScore', 0] },
            avgTime: { $round: ['$avgTime', 0] }
          }
        }
      ]);
      break;

    case 'score':
      analysis = await Round.aggregate([
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
            groupBy: '$score',
            boundaries: [0, 1000, 2000, 3000, 4000, 4500, 4900, 5000],
            default: 'other',
            output: {
              count: { $sum: 1 },
              avgDistance: { $avg: '$distance_km' },
              avgTime: { $avg: '$time_taken' }
            }
          }
        },
        {
          $project: {
            range: '$_id',
            count: 1,
            avgDistance: { $round: ['$avgDistance', 0] },
            avgTime: { $round: ['$avgTime', 0] }
          }
        }
      ]);
      break;

    case 'time':
      analysis = await Round.aggregate([
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
            groupBy: '$time_taken',
            boundaries: [0, 5, 10, 20, 30, 60, 120],
            default: 'other',
            output: {
              count: { $sum: 1 },
              avgScore: { $avg: '$score' },
              avgDistance: { $avg: '$distance_km' }
            }
          }
        },
        {
          $project: {
            range: '$_id',
            count: 1,
            avgScore: { $round: ['$avgScore', 0] },
            avgDistance: { $round: ['$avgDistance', 0] }
          }
        }
      ]);
      break;

    case 'country':
      analysis = await Round.aggregate([
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
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
            avgDistance: { $avg: '$distance_km' },
            correctGuesses: { $sum: { $cond: ['$is_correct_country', 1, 0] } }
          }
        },
        {
          $project: {
            country_code: { $toUpper: '$_id' },
            count: 1,
            avgScore: { $round: ['$avgScore', 0] },
            avgDistance: { $round: ['$avgDistance', 0] },
            accuracy: {
              $round: [
                { $multiply: [{ $divide: ['$correctGuesses', '$count'] }, 100] }, 
                1
              ]
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 }
      ]);
      break;
  }

  res.json({
    success: true,
    data: analysis,
    meta: {
      type,
      filters: {
        userId,
        dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
      }
    }
  });
}));

export default router;
