# GeoGuessr Stats - MVP Data Model

## Overview

Simplified data model for the GeoGuessr Stats MVP, focusing only on essential features for user authentication, game data storage, and basic statistics.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │──────▶│    Games    │──────▶│   Rounds    │
│             │   1:N  │             │   1:N │             │
└─────────────┘       └─────────────┘       └─────────────┘
```

## Core Entities

### 1. Users Collection

**Purpose**: Store basic user information and authentication cookies.

```typescript
interface User {
  _id: ObjectId;
  geoguessr_user_id: string;
  username: string;
  created_at: Date;
  last_sync: Date;
  
  // Authentication
  geoguessr_cookies: {
    session_cookie: string;
    expires_at: Date;
  };
}
```

**MongoDB Schema**:
```javascript
const userSchema = new mongoose.Schema({
  geoguessr_user_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  last_sync: Date,
  
  geoguessr_cookies: {
    session_cookie: { type: String, required: true },
    expires_at: { type: Date, required: true }
  }
}, { 
  timestamps: true,
  collection: 'users'
});
```

### 2. Games Collection

**Purpose**: Store individual game data with rounds embedded for simplicity.

```typescript
interface Game {
  _id: ObjectId;
  user_id: ObjectId;
  game_token: string; // from GeoGuessr API
  
  // Basic Game Info (from feed endpoint)
  game_mode: string; // "Standard", "Battle Royale", etc.
  map_name: string; // "A Community World"
  map_id: string; // "62a44b22040f04bd36e8a914" (from feed: mapSlug, detailed: map)
  total_score: number; // points from API
  played_at: Date; // time from API
  
  // Game Metadata (from detailed game endpoint)
  game_state: string; // "finished", "in_progress", etc.
  round_count: number; // 5
  time_limit: number; // 0 for no limit, seconds if limited
  forbid_moving: boolean; // true/false
  forbid_zooming: boolean; // true/false
  forbid_rotating: boolean; // true/false
  panorama_provider: number; // 1 for Google Street View, etc.
  map_bounds: {
    min: {
      lat: number; // -84.9978492265804
      lng: number; // -177.392124018675
    };
    max: {
      lat: number; // 81.6812215033565
      lng: number; // 178.458181840731
    };
  };
  
  // Sync status
  details_fetched: boolean; // whether round details have been fetched
}
```

**MongoDB Schema**:
```javascript
const gameSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  game_token: { type: String, required: true, unique: true, index: true },
  
  // From feed API
  game_mode: { type: String, required: true, index: true },
  map_name: { type: String, required: true },
  map_id: { type: String, required: true, index: true }, // from feed: mapSlug, detailed: map
  total_score: { type: Number, required: true, min: 0, max: 25000 },
  played_at: { type: Date, required: true, index: true },
  
  // Game metadata (from detailed game API)
  game_state: { type: String, enum: ['finished', 'in_progress', 'abandoned'], default: 'finished' },
  round_count: { type: Number, min: 1, max: 5, default: 5 },
  time_limit: { type: Number, min: 0, default: 0 }, // 0 = no limit
  forbid_moving: { type: Boolean, default: false },
  forbid_zooming: { type: Boolean, default: false },
  forbid_rotating: { type: Boolean, default: false },
  panorama_provider: { type: Number, default: 1 }, // 1 = Google Street View
  map_bounds: {
    min: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    },
    max: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  
  details_fetched: { type: Boolean, default: false, index: true }
}, { 
  timestamps: true,
  collection: 'games'
});
```

### 3. Rounds Collection

**Purpose**: Store individual round data for detailed analysis.

```typescript
interface Round {
  _id: ObjectId;
  game_id: ObjectId;
  user_id: ObjectId;
  round_number: number; // 1-5
  
  // Actual location (from game.rounds array)
  actual_lat: number;
  actual_lng: number;
  actual_country_code: string; // streakLocationCode: "th", "ke", "us"
  
  // Player guess (from game.player.guesses array)
  guess_lat: number;
  guess_lng: number;
  
  // Performance metrics
  score: number; // roundScoreInPoints
  distance_meters: number; // distanceInMeters
  distance_km: number; // calculated from meters
  time_taken: number; // time in seconds
  
  // Calculated fields
  is_correct_country: boolean;
  country_guess?: string; // reverse geocoded from guess coordinates
  country_actual?: string; // reverse geocoded from actual coordinates
  
  // Additional context from API
  pano_id?: string; // Street View panorama ID
  heading?: number; // camera heading
  pitch?: number; // camera pitch
  zoom?: number; // camera zoom level
}
```

**MongoDB Schema**:
```javascript
const roundSchema = new mongoose.Schema({
  game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  round_number: { type: Number, required: true, min: 1, max: 5 },
  
  // Actual location
  actual_lat: { type: Number, required: true, min: -90, max: 90 },
  actual_lng: { type: Number, required: true, min: -180, max: 180 },
  actual_country_code: { type: String, required: true, index: true },
  
  // Player guess
  guess_lat: { type: Number, required: true, min: -90, max: 90 },
  guess_lng: { type: Number, required: true, min: -180, max: 180 },
  
  // Performance
  score: { type: Number, required: true, min: 0, max: 5000 },
  distance_meters: { type: Number, required: true, min: 0 },
  distance_km: { type: Number, required: true, min: 0 },
  time_taken: { type: Number, required: true, min: 0 },
  
  // Calculated/derived
  is_correct_country: { type: Boolean, required: true, index: true },
  country_guess: String,
  country_actual: String,
  
  // Additional context
  pano_id: String,
  heading: Number,
  pitch: Number,
  zoom: Number
}, { 
  timestamps: true,
  collection: 'rounds'
});

// Compound indexes for efficient queries
roundSchema.index({ game_id: 1, round_number: 1 });
roundSchema.index({ user_id: 1, actual_country_code: 1 });
roundSchema.index({ user_id: 1, is_correct_country: 1 });
```

## Essential Indexes

```javascript
// Users
db.users.createIndex({ "geoguessr_user_id": 1 }, { unique: true });

// Games
db.games.createIndex({ "user_id": 1, "played_at": -1 });
db.games.createIndex({ "game_token": 1 }, { unique: true });
db.games.createIndex({ "user_id": 1, "game_mode": 1 });
db.games.createIndex({ "user_id": 1, "details_fetched": 1 });
db.games.createIndex({ "user_id": 1, "forbid_moving": 1 });
db.games.createIndex({ "map_id": 1 });
db.games.createIndex({ "panorama_provider": 1 });

// Rounds
db.rounds.createIndex({ "game_id": 1, "round_number": 1 });
db.rounds.createIndex({ "user_id": 1, "actual_country_code": 1 });
db.rounds.createIndex({ "user_id": 1, "is_correct_country": 1 });
db.rounds.createIndex({ "user_id": 1, "score": -1 });
db.rounds.createIndex({ "actual_lat": "2dsphere", "actual_lng": "2dsphere" });
db.rounds.createIndex({ "guess_lat": "2dsphere", "guess_lng": "2dsphere" });
```

## GeoGuessr API Integration

### Data Sync Strategy
1. **Feed API**: Use token-based pagination through `/api/v4/feed/private` to get all game tokens
2. **Game Details**: For each game_token, fetch detailed data from `/api/v3/games/{gameToken}`
3. **Two-phase sync**: 
   - Phase 1: Use pagination tokens to collect all game tokens with basic info from feed
   - Phase 2: Fetch detailed game data including rounds for each token

### API Field Mapping

#### From Feed Endpoint (Token-based Pagination)
```javascript
// GET /api/v4/feed/private
// GET /api/v4/feed/private?paginationToken={token}

// Response structure:
{
  entries: [...],
  paginationToken: "eyJIYXNoS2V5Ijp7IlMiOiI1ZmViODZkYjg5MmJmMDAwMDFhOWRlOTJfYWN0aXZpdHkifSwiQ3JlYXRlZCI6eyJTIjoiMjAyNS0wNS0zMVQwMjoyMTozMy44MjFaIn19"
}

// Each entry in feed:
{
  gameToken: "7fXp0hHN9vydteah", // → game_token
  mapName: "A Community World", // → map_name  
  mapSlug: "62a44b22040f04bd36e8a914", // → map_id
  points: 17158, // → total_score
  gameMode: "Standard", // → game_mode
  time: "2025-08-09T11:25:31.4110000+00:00" // → played_at
}
```

#### From Detailed Game Endpoint
```javascript
// GET /api/v3/games/{gameToken}
// Example: GET https://www.geoguessr.com/api/v3/games/OPXroRj78Ze3CN4n

{
  token: "PTVh2zWrcMIN3XFW", // → game_token (matches feed)
  state: "finished", // → game_state
  roundCount: 5, // → round_count
  timeLimit: 0, // → time_limit
  forbidMoving: true, // → forbid_moving
  forbidZooming: false, // → forbid_zooming
  forbidRotating: false, // → forbid_rotating
  map: "62a44b22040f04bd36e8a914", // → map_id (confirms feed mapSlug)
  panoramaProvider: 1, // → panorama_provider
  bounds: {
    min: { lat: -84.9978492265804, lng: -177.392124018675 }, // → map_bounds.min
    max: { lat: 81.6812215033565, lng: 178.458181840731 }   // → map_bounds.max
  },
  player.totalScore.amount: "5682", // → total_score (confirms feed points)
  // map_name, game_mode, played_at come from feed endpoint
}

// Round data (combine rounds[] and player.guesses[])
rounds[i] = {
  lat: 16.1769162962492, // → actual_lat
  lng: 101.899847065295, // → actual_lng
  streakLocationCode: "th", // → actual_country_code
}

player.guesses[i] = {
  lat: 40.3548934554668, // → guess_lat
  lng: 21.7912896333449, // → guess_lng
  roundScoreInPoints: 66, // → score
  distanceInMeters: 8025398.96376524, // → distance_meters
  time: 10 // → time_taken
}

// Calculated fields
distance_km = distance_meters / 1000
is_correct_country = (actual_country_code from coords === guess_country_code from coords)
```

## API Query Examples

### Get User's Games with Filters
```javascript
// Get recent games by mode
db.games.find({ 
  user_id: ObjectId("..."), 
  game_mode: "Standard" 
}).sort({ played_at: -1 }).limit(20);

// Get games from last month
db.games.find({ 
  user_id: ObjectId("..."), 
  played_at: { $gte: new Date("2024-01-01") } 
});

// Get games that need round details fetched
db.games.find({ 
  user_id: ObjectId("..."), 
  details_fetched: false 
});

// Get NMPZ games (No Move, No Pan, No Zoom)
db.games.find({ 
  user_id: ObjectId("..."), 
  forbid_moving: true,
  forbid_zooming: true 
});

// Get timed games
db.games.find({ 
  user_id: ObjectId("..."), 
  time_limit: { $gt: 0 } 
});
```

### Calculate Statistics
```javascript
// Country accuracy for a user (using separate rounds collection)
db.rounds.aggregate([
  { $match: { user_id: ObjectId("...") } },
  { $group: {
    _id: "$actual_country_code",
    total_rounds: { $sum: 1 },
    correct_guesses: { $sum: { $cond: ["$is_correct_country", 1, 0] } },
    avg_score: { $avg: "$score" },
    avg_distance_km: { $avg: "$distance_km" },
    total_distance_km: { $sum: "$distance_km" },
    best_score: { $max: "$score" },
    worst_score: { $min: "$score" }
  }},
  { $addFields: { 
    accuracy_percentage: { $multiply: [{ $divide: ["$correct_guesses", "$total_rounds"] }, 100] }
  }},
  { $sort: { accuracy_percentage: -1 } }
]);

// Performance by game mode
db.games.aggregate([
  { $match: { user_id: ObjectId("...") } },
  { $group: {
    _id: "$game_mode",
    total_games: { $sum: 1 },
    avg_score: { $avg: "$total_score" },
    best_score: { $max: "$total_score" },
    worst_score: { $min: "$total_score" }
  }},
  { $sort: { avg_score: -1 } }
]);

// Performance by game constraints (Moving vs No Moving)
db.games.aggregate([
  { $match: { user_id: ObjectId("...") } },
  { $group: {
    _id: {
      forbid_moving: "$forbid_moving",
      forbid_zooming: "$forbid_zooming"
    },
    total_games: { $sum: 1 },
    avg_score: { $avg: "$total_score" },
    game_type: { $first: { 
      $cond: {
        if: { $and: ["$forbid_moving", "$forbid_zooming"] },
        then: "NMPZ",
        else: { $cond: {
          if: "$forbid_moving",
          then: "No Moving",
          else: "Standard"
        }}
      }
    }}
  }},
  { $sort: { avg_score: -1 } }
]);

// Find rounds with perfect scores
db.rounds.find({ 
  user_id: ObjectId("..."), 
  score: 5000 
});

// Get user's performance over time
db.rounds.aggregate([
  { $match: { user_id: ObjectId("...") } },
  { $lookup: {
    from: "games",
    localField: "game_id",
    foreignField: "_id",
    as: "game"
  }},
  { $unwind: "$game" },
  { $group: {
    _id: { 
      year: { $year: "$game.played_at" },
      month: { $month: "$game.played_at" }
    },
    avg_score: { $avg: "$score" },
    total_rounds: { $sum: 1 },
    perfect_scores: { $sum: { $cond: [{ $eq: ["$score", 5000] }, 1, 0] } }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } }
]);
```

---

*Simplified MVP data model focusing on essential features only.*
