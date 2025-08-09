import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// API Documentation endpoint
router.get('/', (req, res) => {
  const apiInfo = {
    name: 'GeoGuessr Stats API',
    version: '1.0.0',
    description: 'REST API for GeoGuessr game statistics and analytics',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    documentation: {
      full: '/api/docs/full',
      interactive: '/api/docs/interactive',
      markdown: '/api/docs/markdown'
    },
    endpoints: {
      health: {
        url: '/health',
        method: 'GET',
        description: 'Check API server status and uptime'
      },
      apiInfo: {
        url: '/api',
        method: 'GET', 
        description: 'Get API information and available endpoints'
      },
      mapRounds: {
        url: '/api/map/rounds',
        method: 'GET',
        description: 'Retrieve round data for map visualization',
        parameters: {
          userId: 'string - User ID to filter rounds',
          page: 'number - Page number (default: 1)',
          limit: 'number - Results per page (default: 50, max: 500)',
          minScore: 'number - Minimum round score',
          maxScore: 'number - Maximum round score',
          countries: 'string - Comma-separated country codes',
          gameMode: 'string - Game mode filter',
          startDate: 'string - Start date (ISO 8601)',
          endDate: 'string - End date (ISO 8601)',
          mapId: 'string - Specific map ID',
          sortBy: 'string - Sort field (score, distance, date)',
          order: 'string - Sort order (asc, desc)'
        }
      },
      mapCountries: {
        url: '/api/map/countries',
        method: 'GET',
        description: 'Retrieve country performance statistics',
        parameters: {
          userId: 'string - User ID to filter data',
          gameMode: 'string - Game mode filter',
          startDate: 'string - Start date (ISO 8601)',
          endDate: 'string - End date (ISO 8601)',
          minRounds: 'number - Minimum rounds per country',
          sortBy: 'string - Sort field (accuracy, totalRounds, avgScore)',
          order: 'string - Sort order (asc, desc)'
        }
      }
    },
    examples: {
      healthCheck: {
        request: 'GET /health',
        curl: 'curl -X GET http://localhost:3000/health'
      },
      mapRoundsBasic: {
        request: 'GET /api/map/rounds?userId=5feb86db892bf00001a9de92',
        curl: 'curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92"'
      },
      mapRoundsFiltered: {
        request: 'GET /api/map/rounds?userId=5feb86db892bf00001a9de92&minScore=3000&countries=us,gb',
        curl: 'curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&minScore=3000&countries=us,gb"'
      },
      countryPerformance: {
        request: 'GET /api/map/countries?userId=5feb86db892bf00001a9de92',
        curl: 'curl -X GET "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92"'
      }
    },
    responseFormats: {
      success: {
        description: 'All successful API responses follow this structure',
        example: {
          success: true,
          data: '// Response data object or array',
          meta: '// Additional metadata'
        }
      },
      error: {
        description: 'All error responses follow this structure',
        example: {
          success: false,
          error: 'Error type',
          message: 'Detailed error message',
          timestamp: '2024-01-15T10:30:00Z',
          statusCode: 400
        }
      },
      pagination: {
        description: 'Endpoints that support pagination include this structure',
        example: {
          pagination: {
            page: 1,
            limit: 50,
            total: 156,
            pages: 4,
            hasNext: true,
            hasPrev: false
          }
        }
      }
    },
    dataModels: {
      roundData: {
        description: 'Round data structure used in /api/map/rounds responses',
        fields: {
          round_number: 'number - Round sequence number (1-5)',
          actual_lat: 'number - Actual location latitude (-90 to 90)',
          actual_lng: 'number - Actual location longitude (-180 to 180)',
          guess_lat: 'number - User guess latitude (-90 to 90)',
          guess_lng: 'number - User guess longitude (-180 to 180)',
          actual_country_code: 'string - ISO country code (uppercase)',
          country_guess: 'string - User country guess (uppercase)',
          score: 'number - Round score (0-5000)',
          distance_km: 'number - Distance between actual and guess (km)',
          time_taken: 'number - Time taken in seconds',
          is_correct_country: 'boolean - Whether country guess was correct',
          game: {
            map_name: 'string - Name of the map played',
            game_mode: 'string - Game mode (standard, battle_royale, etc.)',
            total_score: 'number - Total game score',
            played_at: 'string - Game timestamp (ISO 8601)'
          }
        }
      },
      countryPerformance: {
        description: 'Country performance structure used in /api/map/countries responses',
        fields: {
          country_code: 'string - ISO country code (uppercase)',
          totalRounds: 'number - Total rounds played in this country',
          correctGuesses: 'number - Number of correct country guesses',
          accuracy: 'number - Accuracy percentage (0-100)',
          avgScore: 'number - Average score for this country',
          totalScore: 'number - Total points scored in this country',
          avgDistance: 'number - Average distance in kilometers',
          minDistance: 'number - Best (minimum) distance',
          maxDistance: 'number - Worst (maximum) distance',
          perfectScores: 'number - Number of perfect scores (5000 points)',
          perfectRate: 'number - Perfect score rate percentage'
        }
      }
    },
    httpStatusCodes: {
      200: 'Success',
      400: 'Bad Request - Invalid parameters',
      404: 'Not Found - Endpoint or resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error'
    },
    rateLimiting: {
      limit: '100 requests per 15 minutes per IP address',
      exceeded: 'Returns 429 Too Many Requests',
      headers: 'Rate limit information included in response headers'
    },
    security: {
      current: [
        'Rate limiting (100 requests per 15 minutes)',
        'CORS configured for frontend domains',
        'Security headers via Helmet',
        'Basic parameter validation',
        'Error handling (sensitive info not exposed)'
      ],
      planned: [
        'Authentication middleware',
        'Request logging and monitoring',
        'Input sanitization',
        'API key management',
        'Role-based access control'
      ]
    },
    meta: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime()
    }
  };

  res.json(apiInfo);
});

// Full interactive documentation
router.get('/interactive', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoGuessr Stats API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .endpoint {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
        }
        .method {
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
        }
        .url { font-family: monospace; font-weight: bold; }
        .try-button {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .try-button:hover { background: #2980b9; }
        .response {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 6px;
            margin-top: 10px;
            font-family: monospace;
            overflow-x: auto;
            display: none;
        }
        .nav {
            background: #34495e;
            color: white;
            padding: 10px 0;
            margin: -30px -30px 30px -30px;
            border-radius: 8px 8px 0 0;
        }
        .nav ul {
            list-style: none;
            padding: 0 30px;
            margin: 0;
            display: flex;
            gap: 20px;
        }
        .nav a {
            color: #ecf0f1;
            text-decoration: none;
        }
        .nav a:hover {
            color: #3498db;
        }
        .status-codes {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        .status-code {
            font-weight: bold;
            color: #e74c3c;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .example-request {
            background: #27ae60;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 10px 0;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <nav class="nav">
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#endpoints">Endpoints</a></li>
                <li><a href="#examples">Examples</a></li>
                <li><a href="#models">Data Models</a></li>
                <li><a href="/api/docs/markdown" target="_blank">Full Documentation</a></li>
            </ul>
        </nav>

        <h1 id="overview">🗺️ GeoGuessr Stats API</h1>
        <p><strong>Version:</strong> 1.0.0 | <strong>Base URL:</strong> <code>${req.protocol}://${req.get('host')}</code></p>
        
        <p>Interactive REST API for GeoGuessr game statistics and map visualization. Perfect for building interactive world maps showing actual game locations, user guesses, and performance analytics.</p>

        <div class="endpoint">
            <div class="method">GET</div>
            <span class="url">/health</span>
            <p>Check API server status and uptime</p>
            <button class="try-button" onclick="tryEndpoint('/health')">Try it!</button>
            <div class="response" id="response-health"></div>
        </div>

        <h2 id="endpoints">🚀 Map Data Endpoints</h2>
        
        <div class="endpoint">
            <div class="method">GET</div>
            <span class="url">/api/map/rounds</span>
            <p><strong>Interactive Map Data</strong> - Get round coordinates for map visualization</p>
            
            <h4>Key Parameters:</h4>
            <table>
                <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
                <tr><td>userId</td><td>string</td><td>User ID to filter rounds (required for data)</td></tr>
                <tr><td>page</td><td>number</td><td>Page number (default: 1)</td></tr>
                <tr><td>limit</td><td>number</td><td>Results per page (default: 50, max: 500)</td></tr>
                <tr><td>minScore</td><td>number</td><td>Minimum round score (0-5000)</td></tr>
                <tr><td>countries</td><td>string</td><td>Comma-separated country codes (e.g., "us,gb,de")</td></tr>
                <tr><td>gameMode</td><td>string</td><td>Filter by game mode</td></tr>
            </table>
            
            <button class="try-button" onclick="tryEndpoint('/api/map/rounds?limit=3')">Try it!</button>
            <div class="response" id="response-rounds"></div>
        </div>

        <div class="endpoint">
            <div class="method">GET</div>
            <span class="url">/api/map/countries</span>
            <p><strong>Country Performance</strong> - Get aggregated statistics by country for choropleth maps</p>
            
            <h4>Key Parameters:</h4>
            <table>
                <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
                <tr><td>userId</td><td>string</td><td>User ID to filter data (required for data)</td></tr>
                <tr><td>minRounds</td><td>number</td><td>Minimum rounds per country</td></tr>
                <tr><td>sortBy</td><td>string</td><td>Sort by accuracy, totalRounds, or avgScore</td></tr>
                <tr><td>startDate</td><td>string</td><td>Start date (YYYY-MM-DD)</td></tr>
                <tr><td>endDate</td><td>string</td><td>End date (YYYY-MM-DD)</td></tr>
            </table>
            
            <button class="try-button" onclick="tryEndpoint('/api/map/countries')">Try it!</button>
            <div class="response" id="response-countries"></div>
        </div>

        <h2 id="examples">💡 Quick Examples</h2>
        
        <div class="example-request">
            # Get map data for user with score filtering
            curl "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&minScore=3000"
        </div>

        <div class="example-request">
            # Get country performance sorted by accuracy
            curl "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92&sortBy=accuracy"
        </div>

        <h2 id="models">📊 Response Data Models</h2>
        
        <h3>Round Data (for Interactive Maps)</h3>
        <p>Each round contains actual and guess coordinates for map visualization:</p>
        <pre><code>{
  "round_number": 1,
  "actual_lat": 40.7128,     // Actual location latitude
  "actual_lng": -74.0060,    // Actual location longitude  
  "guess_lat": 40.7580,      // User guess latitude
  "guess_lng": -73.9855,     // User guess longitude
  "score": 4500,             // Round score (0-5000)
  "distance_km": 5.2,        // Distance between actual and guess
  "actual_country_code": "US",
  "is_correct_country": true,
  "game": {
    "map_name": "A Community World",
    "game_mode": "standard",
    "played_at": "2024-01-15T10:30:00Z"
  }
}</code></pre>

        <h3>Country Performance (for Choropleth Maps)</h3>
        <p>Aggregated statistics for each country:</p>
        <pre><code>{
  "country_code": "US",
  "totalRounds": 23,
  "correctGuesses": 18,
  "accuracy": 78.3,          // Percentage accuracy
  "avgScore": 3456,          // Average score
  "avgDistance": 245.6,      // Average distance in km
  "perfectScores": 3,        // Number of 5000-point rounds
  "perfectRate": 13.0        // Perfect score percentage
}</code></pre>

        <h2>📋 HTTP Status Codes</h2>
        <div class="status-codes">
            <span class="status-code">200</span><span>Success</span>
            <span class="status-code">400</span><span>Bad Request - Invalid parameters</span>
            <span class="status-code">404</span><span>Not Found - Endpoint does not exist</span>
            <span class="status-code">429</span><span>Too Many Requests - Rate limit exceeded (100/15min)</span>
            <span class="status-code">500</span><span>Internal Server Error</span>
        </div>

        <h2>🔒 Security & Rate Limiting</h2>
        <ul>
            <li><strong>Rate Limit:</strong> 100 requests per 15 minutes per IP</li>
            <li><strong>CORS:</strong> Configured for frontend development</li>
            <li><strong>Security Headers:</strong> Helmet middleware applied</li>
            <li><strong>Input Validation:</strong> Basic parameter validation</li>
        </ul>

        <h2>🛠️ Frontend Integration</h2>
        <p>Perfect for building interactive maps with libraries like:</p>
        <ul>
            <li><strong>Leaflet.js:</strong> Use round coordinates to plot actual vs guess markers</li>
            <li><strong>Mapbox:</strong> Create custom visualizations with score-based styling</li>
            <li><strong>D3.js:</strong> Build choropleth maps using country performance data</li>
            <li><strong>React Map Libraries:</strong> Integrate directly with React components</li>
        </ul>

        <div style="margin-top: 40px; padding: 20px; background: #3498db; color: white; border-radius: 6px;">
            <h3>🎯 Ready for Interactive Map Development!</h3>
            <p>This API provides all the data needed for:</p>
            <ul>
                <li>📍 Plotting actual game locations on world maps</li>
                <li>📍 Showing user guess locations with accuracy indicators</li>
                <li>📏 Drawing connection lines between actual and guess points</li>
                <li>🎨 Color-coding based on scores and accuracy</li>
                <li>🗺️ Creating country performance choropleth maps</li>
                <li>🔍 Filtering and analyzing performance over time</li>
            </ul>
        </div>
    </div>

    <script>
        async function tryEndpoint(endpoint) {
            const responseId = 'response-' + endpoint.split('/').pop().split('?')[0];
            const responseDiv = document.getElementById(responseId);
            
            try {
                responseDiv.style.display = 'block';
                responseDiv.textContent = 'Loading...';
                
                const response = await fetch(endpoint);
                const data = await response.json();
                
                responseDiv.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                responseDiv.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>`;

  res.send(html);
});

// Serve markdown documentation
router.get('/markdown', (req, res) => {
  try {
    const docsPath = path.join(__dirname, '../../../docs/API_DOCUMENTATION.md');
    
    if (fs.existsSync(docsPath)) {
      const markdown = fs.readFileSync(docsPath, 'utf8');
      
      // Simple markdown to HTML conversion for basic viewing
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GeoGuessr Stats API Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1, h2, h3 { color: #333; }
        h1 { border-bottom: 2px solid #333; }
    </style>
</head>
<body>
    <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
      
      res.send(html);
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Documentation file not found',
        message: 'The markdown documentation file could not be located'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load documentation',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Quick reference endpoint
router.get('/quick', (req, res) => {
  const quickRef = {
    title: 'GeoGuessr Stats API - Quick Reference',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: [
      {
        name: 'Health Check',
        method: 'GET',
        url: '/health',
        example: `curl ${req.protocol}://${req.get('host')}/health`
      },
      {
        name: 'Map Rounds Data',
        method: 'GET', 
        url: '/api/map/rounds',
        params: 'userId, page, limit, minScore, maxScore, countries',
        example: `curl "${req.protocol}://${req.get('host')}/api/map/rounds?userId=USER_ID&limit=10"`
      },
      {
        name: 'Country Performance',
        method: 'GET',
        url: '/api/map/countries', 
        params: 'userId, minRounds, sortBy, order',
        example: `curl "${req.protocol}://${req.get('host')}/api/map/countries?userId=USER_ID"`
      }
    ],
    commonUseCases: [
      {
        task: 'Get map visualization data',
        endpoint: '/api/map/rounds?userId=USER_ID&limit=500',
        description: 'Fetch coordinates for plotting on interactive maps'
      },
      {
        task: 'Build country choropleth',
        endpoint: '/api/map/countries?userId=USER_ID&minRounds=5',
        description: 'Get country-level performance statistics'
      },
      {
        task: 'Filter high-scoring rounds',
        endpoint: '/api/map/rounds?userId=USER_ID&minScore=4000',
        description: 'Show only excellent performance rounds'
      },
      {
        task: 'Analyze specific countries',
        endpoint: '/api/map/rounds?userId=USER_ID&countries=us,gb,de',
        description: 'Focus on specific regions'
      }
    ],
    dataFlow: {
      step1: 'Fetch round data from /api/map/rounds',
      step2: 'Extract actual_lat, actual_lng, guess_lat, guess_lng',
      step3: 'Plot markers and connections on your map library',
      step4: 'Use score and distance for color coding',
      step5: 'Fetch country data for choropleth overlays'
    },
    responseStructure: {
      success: true,
      data: {
        rounds: 'Array of round objects with coordinates',
        pagination: 'Page info for handling large datasets'
      },
      meta: {
        filters: 'Applied filters for reference'
      }
    }
  };

  res.json(quickRef);
});

export default router;
