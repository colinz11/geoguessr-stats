import { GeoGuessrApiClient } from './geoguessrApi';
import { User, Game, Round } from '../models';
import { IUser, IGame, IRound } from '../types';
import { 
  GeoGuessrGameDetails, 
  GeoGuessrGamePayload,
  SyncProgress, 
  SyncResult 
} from '../types/geoguessr';

export class SyncService {
  private apiClient: GeoGuessrApiClient;
  private user: IUser;

  constructor(apiClient: GeoGuessrApiClient, user: IUser) {
    this.apiClient = apiClient;
    this.user = user;
  }

  /**
   * Sync all user's game data
   */
  async syncAllData(maxPages: number = 5): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      gamesProcessed: 0,
      newGames: 0,
      updatedGames: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log(`🔄 Starting data sync for user: ${this.user.username}`);

      // Phase 1: Get all game tokens from feed
      console.log('📋 Phase 1: Fetching game tokens from feed...');
      const gameTokens = await this.apiClient.getAllGameTokens(maxPages);
      
      if (gameTokens.length === 0) {
        console.log('ℹ️ No games found in feed');
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Phase 2: Process each game
      console.log(`🎮 Phase 2: Processing ${gameTokens.length} games...`);
      
      for (let i = 0; i < gameTokens.length; i++) {
        const gameToken = gameTokens[i];
        
        try {
          console.log(`📊 Processing game ${i + 1}/${gameTokens.length}: ${gameToken}`);
          
          // Check if game already exists
          const existingGame = await Game.findOne({ game_token: gameToken });
          
          if (existingGame && existingGame.details_fetched) {
            console.log(`⏭️  Game ${gameToken} already processed, skipping`);
            continue;
          }

          // Fetch game details
          const gameDetails = await this.apiClient.getGameDetails(gameToken!);
          
          // Save or update game
          const gameResult = await this.saveGameData(gameDetails);
          
          if (gameResult.isNew) {
            result.newGames++;
          } else {
            result.updatedGames++;
          }
          
          result.gamesProcessed++;

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMsg = `Failed to process game ${gameToken}: ${error}`;
          console.error('❌', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Update user's last sync time
      await User.findByIdAndUpdate(this.user._id, {
        last_sync: new Date()
      });

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      console.log(`✅ Sync completed in ${result.duration}ms`);
      console.log(`📊 Results: ${result.newGames} new, ${result.updatedGames} updated, ${result.errors.length} errors`);

      return result;

    } catch (error) {
      const errorMsg = `Sync failed: ${error}`;
      console.error('❌', errorMsg);
      result.errors.push(errorMsg);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Save game data and rounds to database
   */
  private async saveGameData(gameDetails: GeoGuessrGameDetails): Promise<{ isNew: boolean; game: IGame }> {
    let isNew = false;

    // Check if game exists
    let game = await Game.findOne({ game_token: gameDetails.token });
    
    if (!game) {
      // Create new game
      game = new Game({
        user_id: this.user._id,
        game_token: gameDetails.token,
        map_id: gameDetails.map,
        map_name: gameDetails.mapName,
        game_mode: gameDetails.mode,
        total_score: parseInt(gameDetails.player.totalScore.amount),
        played_at: new Date(), // Will be updated with actual time if available
        
        // Game metadata
        game_state: gameDetails.state,
        round_count: gameDetails.roundCount,
        time_limit: gameDetails.timeLimit,
        forbid_moving: gameDetails.forbidMoving,
        forbid_zooming: gameDetails.forbidZooming,
        forbid_rotating: gameDetails.forbidRotating,
        panorama_provider: gameDetails.panoramaProvider,
        map_bounds: {
          min: {
            lat: gameDetails.bounds.min.lat,
            lng: gameDetails.bounds.min.lng
          },
          max: {
            lat: gameDetails.bounds.max.lat,
            lng: gameDetails.bounds.max.lng
          }
        },
        
        details_fetched: true
      });
      isNew = true;
    } else {
      // Update existing game with details
      game.total_score = parseInt(gameDetails.player.totalScore.amount);
      game.game_state = gameDetails.state as 'finished' | 'in_progress' | 'abandoned';
      game.round_count = gameDetails.roundCount;
      game.time_limit = gameDetails.timeLimit;
      game.forbid_moving = gameDetails.forbidMoving;
      game.forbid_zooming = gameDetails.forbidZooming;
      game.forbid_rotating = gameDetails.forbidRotating;
      game.panorama_provider = gameDetails.panoramaProvider;
      game.map_bounds = {
        min: {
          lat: gameDetails.bounds.min.lat,
          lng: gameDetails.bounds.min.lng
        },
        max: {
          lat: gameDetails.bounds.max.lat,
          lng: gameDetails.bounds.max.lng
        }
      };
      game.details_fetched = true;
    }

    await game.save();

    // Save rounds
    await this.saveRounds(game, gameDetails);

    return { isNew, game };
  }

  /**
   * Save individual rounds for a game
   */
  private async saveRounds(game: IGame, gameDetails: GeoGuessrGameDetails): Promise<void> {
    // Delete existing rounds for this game (in case of re-sync)
    await Round.deleteMany({ game_id: game._id });

    // Create new rounds
    const rounds: any[] = [];

    for (let i = 0; i < gameDetails.rounds.length; i++) {
      const roundData = gameDetails.rounds[i];
      const guessData = gameDetails.player.guesses[i];

      if (!roundData || !guessData) {
        console.warn(`⚠️ Missing round or guess data for round ${i + 1} in game ${game.game_token}`);
        continue;
      }

      const round: any = {
        game_id: game._id,
        user_id: this.user._id,
        round_number: i + 1,
        
        // Actual location
        actual_lat: roundData.lat,
        actual_lng: roundData.lng,
        actual_country_code: roundData.streakLocationCode,
        
        // Player's guess
        guess_lat: guessData.lat,
        guess_lng: guessData.lng,
        
        // Performance metrics
        score: guessData.roundScoreInPoints,
        distance_meters: guessData.distanceInMeters,
        distance_km: guessData.distanceInMeters / 1000, // Convert to km
        time_taken: guessData.time,
        
        // Calculated fields
        is_correct_country: roundData.streakLocationCode === guessData.streakLocationCode,
        country_guess: guessData.streakLocationCode || undefined,
        country_actual: roundData.streakLocationCode,
        
        // Street View info
        pano_id: roundData.panoId,
        heading: roundData.heading,
        pitch: roundData.pitch,
        zoom: roundData.zoom
      };

      rounds.push(round);
    }

    if (rounds.length > 0) {
      await Round.insertMany(rounds);
      console.log(`✅ Saved ${rounds.length} rounds for game ${game.game_token}`);
    }
  }
}

export default SyncService;
