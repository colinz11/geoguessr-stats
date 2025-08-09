import { Types } from 'mongoose';
import { User, Game, Round } from '../models';
import { UserCreateDTO, GameCreateDTO, GameUpdateDTO, RoundCreateDTO } from '../types';

/**
 * Database utility functions for common CRUD operations
 */

// User utilities
export const userUtils = {
  async create(userData: UserCreateDTO) {
    const user = new User({
      geoguessr_user_id: userData.geoguessr_user_id,
      username: userData.username,
      geoguessr_cookies: {
        session_cookie: userData.session_cookie,
        expires_at: userData.expires_at
      }
    });
    return await user.save();
  },

  async findByGeoGuessrId(geoguessrUserId: string) {
    return await User.findOne({ geoguessr_user_id: geoguessrUserId });
  },

  async updateCookies(userId: Types.ObjectId, sessionCookie: string, expiresAt: Date) {
    return await User.findByIdAndUpdate(
      userId,
      {
        'geoguessr_cookies.session_cookie': sessionCookie,
        'geoguessr_cookies.expires_at': expiresAt
      },
      { new: true }
    );
  },

  async updateLastSync(userId: Types.ObjectId) {
    return await User.findByIdAndUpdate(
      userId,
      { last_sync: new Date() },
      { new: true }
    );
  }
};

// Game utilities
export const gameUtils = {
  async create(gameData: GameCreateDTO) {
    const game = new Game(gameData);
    return await game.save();
  },

  async updateDetails(gameToken: string, updateData: GameUpdateDTO) {
    return await Game.findOneAndUpdate(
      { game_token: gameToken },
      updateData,
      { new: true }
    );
  },

  async findByToken(gameToken: string) {
    return await Game.findOne({ game_token: gameToken });
  },

  async findPendingDetails(userId: Types.ObjectId, limit = 50) {
    return await Game.find({ 
      user_id: userId, 
      details_fetched: false 
    })
      .sort({ played_at: -1 })
      .limit(limit);
  },

  async markDetailsAsFetched(gameToken: string) {
    return await Game.findOneAndUpdate(
      { game_token: gameToken },
      { details_fetched: true },
      { new: true }
    );
  },

  async getUserGames(userId: Types.ObjectId, filters?: {
    gameMode?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }) {
    const query: any = { user_id: userId };
    
    if (filters?.gameMode) {
      query.game_mode = filters.gameMode;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.played_at = {};
      if (filters.startDate) query.played_at.$gte = filters.startDate;
      if (filters.endDate) query.played_at.$lte = filters.endDate;
    }
    
    let gameQuery = Game.find(query).sort({ played_at: -1 });
    
    if (filters?.skip) gameQuery = gameQuery.skip(filters.skip);
    if (filters?.limit) gameQuery = gameQuery.limit(filters.limit);
    
    return await gameQuery.exec();
  }
};

// Round utilities
export const roundUtils = {
  async createMany(roundsData: RoundCreateDTO[]) {
    return await Round.insertMany(roundsData);
  },

  async findByGame(gameId: Types.ObjectId) {
    return await Round.find({ game_id: gameId }).sort({ round_number: 1 });
  },

  async getUserRounds(userId: Types.ObjectId, filters?: {
    countryCode?: string;
    perfectOnly?: boolean;
    correctCountryOnly?: boolean;
    limit?: number;
    skip?: number;
  }) {
    const query: any = { user_id: userId };
    
    if (filters?.countryCode) {
      query.actual_country_code = filters.countryCode.toUpperCase();
    }
    
    if (filters?.perfectOnly) {
      query.score = 5000;
    }
    
    if (filters?.correctCountryOnly) {
      query.is_correct_country = true;
    }
    
    let roundQuery = Round.find(query).sort({ createdAt: -1 });
    
    if (filters?.skip) roundQuery = roundQuery.skip(filters.skip);
    if (filters?.limit) roundQuery = roundQuery.limit(filters.limit);
    
    return await roundQuery.exec();
  },

  async getCountryStats(userId: Types.ObjectId) {
    return await Round.aggregate([
      { $match: { user_id: userId } },
      { 
        $group: {
          _id: '$actual_country_code',
          total_rounds: { $sum: 1 },
          correct_guesses: { 
            $sum: { $cond: ['$is_correct_country', 1, 0] } 
          },
          avg_score: { $avg: '$score' },
          avg_distance_km: { $avg: '$distance_km' },
          best_score: { $max: '$score' },
          worst_score: { $min: '$score' },
          perfect_scores: {
            $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          country_code: '$_id',
          accuracy_percentage: { 
            $multiply: [
              { $divide: ['$correct_guesses', '$total_rounds'] }, 
              100
            ] 
          }
        }
      },
      { $sort: { accuracy_percentage: -1 } },
      { $project: { _id: 0 } }
    ]);
  }
};

// Statistics utilities
export const statsUtils = {
  async getOverviewStats(userId: Types.ObjectId) {
    const [gameStats, roundStats] = await Promise.all([
      Game.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            total_games: { $sum: 1 },
            avg_score: { $avg: '$total_score' },
            best_score: { $max: '$total_score' },
            worst_score: { $min: '$total_score' },
            games_by_mode: {
              $push: '$game_mode'
            }
          }
        }
      ]),
      Round.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            total_rounds: { $sum: 1 },
            total_distance_km: { $sum: '$distance_km' },
            perfect_scores: {
              $sum: { $cond: [{ $eq: ['$score', 5000] }, 1, 0] }
            },
            countries_played: { $addToSet: '$actual_country_code' }
          }
        }
      ])
    ]);

    const gameData = gameStats[0] || {};
    const roundData = roundStats[0] || {};

    return {
      total_games: gameData.total_games || 0,
      total_rounds: roundData.total_rounds || 0,
      average_score: Math.round(gameData.avg_score || 0),
      best_game_score: gameData.best_score || 0,
      worst_game_score: gameData.worst_score || 0,
      total_distance_km: Math.round(roundData.total_distance_km || 0),
      perfect_scores: roundData.perfect_scores || 0,
      countries_played: roundData.countries_played?.length || 0
    };
  }
};
