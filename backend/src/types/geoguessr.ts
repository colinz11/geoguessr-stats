// GeoGuessr API Response Types

export interface GeoGuessrFeedEntry {
  type: number;
  time: string;
  user: {
    id: string;
    nick: string;
    isVerified: boolean;
    flair: number;
    avatar: {
      url: string;
      anchor: string;
      isDefault: boolean;
    };
  };
  payload: string; // JSON string that needs to be parsed
}

export interface GeoGuessrFeedResponse {
  entries: GeoGuessrFeedEntry[];
  paginationToken?: string;
}

export interface GeoGuessrGamePayload {
  mapSlug: string;
  mapName: string;
  points: number;
  gameToken: string;
  gameMode: string;
}

export interface GeoGuessrGameDetails {
  token: string;
  type: string;
  mode: string;
  state: string;
  roundCount: number;
  timeLimit: number;
  forbidMoving: boolean;
  forbidZooming: boolean;
  forbidRotating: boolean;
  map: string;
  mapName: string;
  panoramaProvider: number;
  bounds: {
    min: { lat: number; lng: number };
    max: { lat: number; lng: number };
  };
  round: number;
  rounds: Array<{
    lat: number;
    lng: number;
    panoId: string;
    heading: number;
    pitch: number;
    zoom: number;
    streakLocationCode: string;
    startTime: string;
  }>;
  player: {
    totalScore: {
      amount: string;
      unit: string;
      percentage: number;
    };
    totalDistance: {
      meters: { amount: string; unit: string };
      miles: { amount: string; unit: string };
    };
    totalDistanceInMeters: number;
    totalStepsCount: number;
    totalTime: number;
    totalStreak: number;
    guesses: Array<{
      lat: number;
      lng: number;
      timedOut: boolean;
      timedOutWithGuess: boolean;
      skippedRound: boolean;
      roundScore: {
        amount: string;
        unit: string;
        percentage: number;
      };
      roundScoreInPercentage: number;
      roundScoreInPoints: number;
      distance: {
        meters: { amount: string; unit: string };
        miles: { amount: string; unit: string };
      };
      distanceInMeters: number;
      stepsCount: number;
      streakLocationCode: string | null;
      time: number;
    }>;
    isLeader: boolean;
    currentPosition: number;
    pin: {
      url: string;
      anchor: string;
      isDefault: boolean;
    };
    newBadges: any[];
    explorer: any;
    id: string;
    nick: string;
    isVerified: boolean;
    flair: number;
    countryCode: string;
  };
  progressChange: any; // Complex object, can be detailed later if needed
}

export interface ApiClientOptions {
  sessionCookie: string; // Full cookie string including _ncfa and session
  baseUrl?: string;
  timeout?: number;
}

export interface SyncProgress {
  phase: 'feed' | 'details';
  totalGames: number;
  processedGames: number;
  currentGame?: string;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  gamesProcessed: number;
  newGames: number;
  updatedGames: number;
  errors: string[];
  duration: number;
}
