import axios from 'axios';
import {
  GeoGuessrFeedResponse,
  GeoGuessrGameDetails,
  GeoGuessrGamePayload,
  ApiClientOptions,
  SyncProgress,
  SyncResult
} from '../types/geoguessr';

export class GeoGuessrApiClient {
  private client: any;
  private sessionCookie: string;

  constructor(options: ApiClientOptions) {
    this.sessionCookie = options.sessionCookie;
    
    this.client = axios.create({
      baseURL: options.baseUrl || 'https://www.geoguessr.com',
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.geoguessr.com/',
        'Cookie': this.sessionCookie
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch user's game feed with pagination support
   */
  async getFeed(paginationToken?: string): Promise<GeoGuessrFeedResponse> {
    try {
      const params = paginationToken ? { paginationToken } : {};
      const response = await this.client.get('/api/v4/feed/private', {
        params
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch feed:', error);
      throw new Error(`Failed to fetch GeoGuessr feed: ${error}`);
    }
  }

  /**
   * Fetch detailed game information by game token
   */
  async getGameDetails(gameToken: string): Promise<GeoGuessrGameDetails> {
    try {
      const response = await this.client.get(`/api/v3/games/${gameToken}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch game details for ${gameToken}:`, error);
      throw new Error(`Failed to fetch game details for ${gameToken}: ${error}`);
    }
  }

  /**
   * Parse game payload from feed entry
   */
  parseGamePayload(payloadString: string): GeoGuessrGamePayload[] {
    try {
      // Handle both single game payload and batch payload
      if (payloadString.startsWith('[')) {
        // Batch payload - array of game objects
        const batch = JSON.parse(payloadString);
        return batch.map((item: any) => item.payload || item);
      } else {
        // Single game payload
        const payload = JSON.parse(payloadString);
        return [payload];
      }
    } catch (error) {
      console.error('❌ Failed to parse game payload:', payloadString);
      throw new Error(`Failed to parse game payload: ${error}`);
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing GeoGuessr API connection...');
      const feed = await this.getFeed();
      console.log(`✅ Connection successful! Found ${feed.entries.length} feed entries`);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all game tokens from feed (with pagination)
   */
  async getAllGameTokens(maxPages: number = 10): Promise<string[]> {
    const gameTokens: string[] = [];
    let paginationToken: string | undefined;
    let pageCount = 0;

    console.log(`📋 Fetching game tokens (max ${maxPages} pages)...`);

    while (pageCount < maxPages) {
      try {
        const feed = await this.getFeed(paginationToken);
        
        console.log(`📄 Page ${pageCount + 1}: ${feed.entries.length} entries`);

        // Extract game tokens from this page
        for (const entry of feed.entries) {
          if (entry.type === 1) { // Game completion entries
            try {
              const payloads = this.parseGamePayload(entry.payload);
              for (const payload of payloads) {
                if (payload.gameToken && !gameTokens.includes(payload.gameToken)) {
                  gameTokens.push(payload.gameToken);
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to parse payload for entry:', entry.payload);
            }
          }
        }

        // Check if there's more data
        if (!feed.paginationToken) {
          console.log('📄 Reached end of feed');
          break;
        }

        paginationToken = feed.paginationToken;
        pageCount++;

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to fetch page ${pageCount + 1}:`, error);
        break;
      }
    }

    console.log(`✅ Found ${gameTokens.length} unique game tokens`);
    return gameTokens;
  }
}

export default GeoGuessrApiClient;
