import { Document, Types, Model } from 'mongoose';

// Base interfaces matching our data model design

export interface IUser extends Document {
  _id: Types.ObjectId;
  geoguessr_user_id: string;
  username: string;
  created_at: Date;
  last_sync: Date;
  
  // Authentication
  geoguessr_cookies: {
    session_cookie: string;
    expires_at: Date;
  };
  
  // Instance methods
  isSessionValid(): boolean;
  updateLastSync(): Promise<IUser>;
  
  // Virtual properties
  hasValidSession: boolean;
}

// Static methods interface
export interface IUserModel extends Model<IUser> {
  findByGeoGuessrId(geoguessrUserId: string): Promise<IUser | null>;
  findWithValidSession(): Promise<IUser[]>;
}

export interface IGame extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  game_token: string;
  
  // Basic Game Info (from feed endpoint)
  game_mode: string;
  map_name: string;
  map_id: string;
  total_score: number;
  played_at: Date;
  
  // Game Metadata (from detailed game endpoint)
  game_state: 'finished' | 'in_progress' | 'abandoned';
  round_count: number;
  time_limit: number;
  forbid_moving: boolean;
  forbid_zooming: boolean;
  forbid_rotating: boolean;
  panorama_provider: number;
  map_bounds: {
    min: {
      lat: number;
      lng: number;
    };
    max: {
      lat: number;
      lng: number;
    };
  };
  
  // Sync status
  details_fetched: boolean;
}

export interface IRound extends Document {
  _id: Types.ObjectId;
  game_id: Types.ObjectId;
  user_id: Types.ObjectId;
  round_number: number;
  
  // Actual location (from game.rounds array)
  actual_lat: number;
  actual_lng: number;
  actual_country_code: string;
  
  // Player guess (from game.player.guesses array)
  guess_lat: number;
  guess_lng: number;
  
  // Performance metrics
  score: number;
  distance_meters: number;
  distance_km: number;
  time_taken: number;
  
  // Calculated fields
  is_correct_country: boolean;
  country_guess?: string;
  country_actual?: string;
  
  // Additional context from API
  pano_id?: string;
  heading?: number;
  pitch?: number;
  zoom?: number;
}

// Data Transfer Objects for API responses
export interface UserCreateDTO {
  geoguessr_user_id: string;
  username: string;
  session_cookie: string;
  expires_at: Date;
}

export interface GameCreateDTO {
  user_id: Types.ObjectId;
  game_token: string;
  game_mode: string;
  map_name: string;
  map_id: string;
  total_score: number;
  played_at: Date;
}

export interface GameUpdateDTO {
  game_state?: 'finished' | 'in_progress' | 'abandoned';
  round_count?: number;
  time_limit?: number;
  forbid_moving?: boolean;
  forbid_zooming?: boolean;
  forbid_rotating?: boolean;
  panorama_provider?: number;
  map_bounds?: {
    min: { lat: number; lng: number };
    max: { lat: number; lng: number };
  };
  details_fetched?: boolean;
}

export interface RoundCreateDTO {
  game_id: Types.ObjectId;
  user_id: Types.ObjectId;
  round_number: number;
  actual_lat: number;
  actual_lng: number;
  actual_country_code: string;
  guess_lat: number;
  guess_lng: number;
  score: number;
  distance_meters: number;
  distance_km: number;
  time_taken: number;
  is_correct_country: boolean;
  country_guess?: string;
  country_actual?: string;
  pano_id?: string;
  heading?: number;
  pitch?: number;
  zoom?: number;
}

// API Response types for statistics
export interface CountryStats {
  country_code: string;
  total_rounds: number;
  correct_guesses: number;
  accuracy_percentage: number;
  avg_score: number;
  avg_distance_km: number;
  best_score: number;
  worst_score: number;
}

export interface OverviewStats {
  total_games: number;
  total_rounds: number;
  average_score: number;
  best_game_score: number;
  worst_game_score: number;
  total_distance_km: number;
  perfect_scores: number;
  countries_played: number;
}
