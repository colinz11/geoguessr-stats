import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Round, Game } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/map/rounds
 * Get all rounds with geographical data for map visualization
 * Essential for interactive world map showing actual vs guess locations
 */
router.get('/rounds', asyncHandler(async (req: express.Request, res: express.Response) => {
  const {
    userId,
    gameMode,
    minScore,
    maxScore,
    countries,
    startDate,
    endDate,
    page = '1',
    limit = '1000'
  } = req.query;

  // Build filter
  const filter: any = {};
  
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId as string);
  }

  if (minScore || maxScore) {
    filter.score = {};
    if (minScore) filter.score.$gte = parseInt(minScore as string);
    if (maxScore) filter.score.$lte = parseInt(maxScore as string);
  }

  if (countries) {
    const countryList = (countries as string).split(',').map((c: string) => c.trim().toLowerCase());
    filter.actual_country_code = { $in: countryList };
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Simple aggregation pipeline
    const pipeline: any[] = [
      { $match: filter }
    ];

    // Add game join for filtering
    if (gameMode || startDate || endDate) {
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

      // Apply game filters
      const gameFilter: any = {};
      if (gameMode) gameFilter['game.game_mode'] = gameMode;
      
      if (startDate || endDate) {
        gameFilter['game.played_at'] = {};
        if (startDate) gameFilter['game.played_at'].$gte = new Date(startDate as string);
        if (endDate) gameFilter['game.played_at'].$lte = new Date(endDate as string + 'T23:59:59.999Z');
      }

      if (Object.keys(gameFilter).length > 0) {
        pipeline.push({ $match: gameFilter });
      }
    }

    // Project essential fields
    pipeline.push({
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
        time_taken: 1,
        is_correct_country: 1,
        game_id: 1,
        game: {
          map_name: '$game.map_name',
          game_mode: '$game.game_mode',
          total_score: '$game.total_score',
          played_at: '$game.played_at'
        }
      }
    });

    pipeline.push(
      { $sort: { 'game.played_at': -1, round_number: 1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    const rounds = await Round.aggregate(pipeline);

    // Get total count (simplified)
    const total = await Round.countDocuments(filter);

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
          countries: countries ? (countries as string).split(',') : null,
          dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map data',
      message: error.message
    });
  }
}));

/**
 * GET /api/map/countries
 * Get country-level performance data for choropleth map
 */
router.get('/countries', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId, startDate, endDate } = req.query;

  const filter: any = {};
  if (userId) {
    filter.user_id = new mongoose.Types.ObjectId(userId as string);
  }

  try {
    const pipeline: any[] = [
      { $match: filter }
    ];

    // Add date filtering if needed
    if (startDate || endDate) {
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

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string + 'T23:59:59.999Z');
      
      if (Object.keys(dateFilter).length > 0) {
        pipeline.push({ $match: { 'game.played_at': dateFilter } });
      }
    }

    pipeline.push(
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
      { $sort: { totalRounds: -1 } }
    );

    const countries = await Round.aggregate(pipeline);

    res.json({
      success: true,
      data: countries,
      meta: {
        total_countries: countries.length,
        filters: {
          userId,
          dateRange: startDate || endDate ? { start: startDate, end: endDate } : null
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch country data',
      message: error.message
    });
  }
}));

export default router;
