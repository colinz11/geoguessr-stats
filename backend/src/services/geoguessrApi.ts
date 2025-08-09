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
  async getAllGameTokens(maxPages: number = Number.POSITIVE_INFINITY): Promise<string[]> {
    const gameTokens: string[] = [];
    const seenTokens = new Set<string>(); // Use Set for faster lookups
    let paginationToken: string | undefined;
    let pageCount = 0;
    let emptyPagesCount = 0;

    console.log(`📋 Fetching ALL game tokens (max ${maxPages} pages)...`);

    while (pageCount < maxPages) {
      try {
        const feed = await this.getFeed(paginationToken);
        pageCount++;

        console.log(`📄 Page ${pageCount}: ${feed.entries.length} entries`);

        let newTokensThisPage = 0;

        // Extract game tokens from this page
        for (const entry of feed.entries) {
          if (entry.type === 1) { // Game completion entries
            try {
              const payloads = this.parseGamePayload(entry.payload);
              for (const payload of payloads) {
                if (payload.gameToken && !seenTokens.has(payload.gameToken)) {
                  seenTokens.add(payload.gameToken);
                  gameTokens.push(payload.gameToken);
                  newTokensThisPage++;
                }
              }
            } catch (error) {
              console.warn('⚠️ Failed to parse payload for entry:', entry.payload);
            }
          }
        }

        console.log(`   → Found ${newTokensThisPage} new game tokens on this page`);

        // If no new tokens found, increment empty pages counter
        if (newTokensThisPage === 0) {
          emptyPagesCount++;
          // If we've had 3 consecutive pages with no new tokens, likely we've seen all data
          if (emptyPagesCount >= 3) {
            console.log('📄 Multiple pages with no new data, likely reached end');
            break;
          }
        } else {
          emptyPagesCount = 0; // Reset counter if we found new tokens
        }

        // Check if there's more data
        if (!feed.paginationToken) {
          console.log('📄 Reached end of feed (no pagination token)');
          break;
        }

        paginationToken = feed.paginationToken;

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (error) {
        console.error(`❌ Failed to fetch page ${pageCount + 1}:`, error);
        // Count the failed page to avoid infinite loops
        pageCount++;
        // Don't break immediately, try next page after a longer delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }

    console.log(`✅ Found ${gameTokens.length} unique game tokens across ${pageCount} pages`);
    return gameTokens;
  }
}

export default GeoGuessrApiClient;
