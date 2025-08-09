import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface RoundData {
  round_number: number;
  actual_lat: number;
  actual_lng: number;
  guess_lat: number;
  guess_lng: number;
  actual_country_code: string;
  country_guess: string;
  score: number;
  distance_km: number;
  time_taken: number;
  is_correct_country: boolean;
  game: {
    map_name: string;
    game_mode: string;
    total_score: number;
    played_at: string;
  };
}

export interface CountryPerformance {
  country_code: string;
  totalRounds: number;
  correctGuesses: number;
  accuracy: number;
  avgScore: number;
  totalScore: number;
  avgDistance: number;
  minDistance: number;
  maxDistance: number;
  perfectScores: number;
  perfectRate: number;
}

export interface MapRoundsResponse {
  success: boolean;
  data: {
    rounds: RoundData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  meta: {
    filters: Record<string, any>;
  };
}

export interface CountriesResponse {
  success: boolean;
  data: CountryPerformance[];
  meta: {
    total_countries: number;
    filters: Record<string, any>;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
}

// API functions
export const apiClient = {
  // Health check
  health: () => api.get('/health'),

  // Map data endpoints
  getMapRounds: (params: {
    userId?: string;
    page?: number;
    limit?: number;
    minScore?: number;
    maxScore?: number;
    countries?: string;
    gameMode?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<MapRoundsResponse> => 
    api.get('/api/map/rounds', { params }).then(res => res.data),

  getCountries: (params: {
    userId?: string;
    gameMode?: string;
    startDate?: string;
    endDate?: string;
    minRounds?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<CountriesResponse> => 
    api.get('/api/map/countries', { params }).then(res => res.data),

  // API documentation
  getApiInfo: () => api.get('/api'),
  getDocs: () => api.get('/api/docs'),
};

export default api;
