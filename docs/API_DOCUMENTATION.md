# GeoGuessr Stats API Documentation

## Overview

The GeoGuessr Stats API provides endpoints for retrieving and analyzing GeoGuessr game statistics, with a focus on interactive map visualization and performance analytics.

**Base URL**: `http://localhost:3000` (development) | `https://your-domain.vercel.app` (production)  
**Version**: 1.0.0  
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [API Information](#api-information)
   - [Map Data](#map-data)
5. [Data Models](#data-models)
6. [Response Formats](#response-formats)
7. [Examples](#examples)

---

## Authentication

Currently, the API operates without authentication for development purposes. User identification is handled via query parameters.

**Future Implementation**: Session-based authentication using GeoGuessr cookies.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "statusCode": 400
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `404` | Not Found - Endpoint or resource not found |
| `500` | Internal Server Error |

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns `429 Too Many Requests`

---

## Endpoints

### Health Check

#### `GET /health`

Check API server status and uptime.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/health
```

---

### API Information

#### `GET /api`

Get API documentation and available endpoints.

**Response:**
```json
{
  "name": "GeoGuessr Stats API",
  "version": "1.0.0",
  "description": "REST API for GeoGuessr game statistics and analytics",
  "endpoints": {
    "map": "/api/map",
    "health": "/health"
  },
  "features": {
    "Interactive Map Data": "/api/map/rounds",
    "Country Performance": "/api/map/countries"
  }
}
```

---

### Map Data

The Map API provides data for interactive world map visualization, showing actual game locations, user guesses, and performance statistics.

#### `GET /api/map/rounds`

Retrieve round data for map visualization with actual and guess coordinates.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userId` | string | User ID to filter rounds | `5feb86db892bf00001a9de92` |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Results per page (default: 50, max: 500) | `100` |
| `minScore` | number | Minimum round score | `1000` |
| `maxScore` | number | Maximum round score | `5000` |
| `countries` | string | Comma-separated country codes | `us,gb,de` |
| `gameMode` | string | Game mode filter | `standard` |
| `startDate` | string | Start date (ISO 8601) | `2024-01-01` |
| `endDate` | string | End date (ISO 8601) | `2024-12-31` |
| `mapId` | string | Specific map ID | `62a44b22040f04bd36e8a914` |
| `sortBy` | string | Sort field (`score`, `distance`, `date`) | `score` |
| `order` | string | Sort order (`asc`, `desc`) | `desc` |

**Response:**
```json
{
  "success": true,
  "data": {
    "rounds": [
      {
        "round_number": 1,
        "actual_lat": 40.7128,
        "actual_lng": -74.0060,
        "guess_lat": 40.7580,
        "guess_lng": -73.9855,
        "actual_country_code": "US",
        "country_guess": "US",
        "score": 4500,
        "distance_km": 5.2,
        "time_taken": 45,
        "is_correct_country": true,
        "game": {
          "map_name": "A Community World",
          "game_mode": "standard",
          "total_score": 15000,
          "played_at": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 156,
      "pages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "filters": {
      "userId": "5feb86db892bf00001a9de92",
      "minScore": 1000,
      "countries": ["US", "GB", "DE"]
    }
  }
}
```

**Example:**
```bash
# Get rounds for a specific user with pagination
curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&page=1&limit=20"

# Filter by score range and countries
curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&minScore=3000&countries=us,gb,de"

# Filter by date range
curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&startDate=2024-01-01&endDate=2024-01-31"
```

---

#### `GET /api/map/countries`

Retrieve country performance statistics for choropleth map visualization.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userId` | string | User ID to filter data | `5feb86db892bf00001a9de92` |
| `gameMode` | string | Game mode filter | `standard` |
| `startDate` | string | Start date (ISO 8601) | `2024-01-01` |
| `endDate` | string | End date (ISO 8601) | `2024-12-31` |
| `minRounds` | number | Minimum rounds per country | `5` |
| `sortBy` | string | Sort field (`accuracy`, `totalRounds`, `avgScore`) | `accuracy` |
| `order` | string | Sort order (`asc`, `desc`) | `desc` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "country_code": "US",
      "totalRounds": 23,
      "correctGuesses": 18,
      "accuracy": 78.3,
      "avgScore": 3456,
      "totalScore": 79488,
      "avgDistance": 245.6,
      "minDistance": 0.1,
      "maxDistance": 1205.3,
      "perfectScores": 3,
      "perfectRate": 13.0
    },
    {
      "country_code": "GB",
      "totalRounds": 15,
      "correctGuesses": 12,
      "accuracy": 80.0,
      "avgScore": 3789,
      "totalScore": 56835,
      "avgDistance": 156.2,
      "minDistance": 0.3,
      "maxDistance": 892.1,
      "perfectScores": 2,
      "perfectRate": 13.3
    }
  ],
  "meta": {
    "total_countries": 2,
    "filters": {
      "userId": "5feb86db892bf00001a9de92",
      "gameMode": "standard"
    }
  }
}
```

**Example:**
```bash
# Get country performance for a user
curl -X GET "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92"

# Filter by date and minimum rounds
curl -X GET "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92&startDate=2024-01-01&minRounds=10"

# Sort by accuracy
curl -X GET "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92&sortBy=accuracy&order=desc"
```

---

## Data Models

### Round Data Model

Used in `/api/map/rounds` responses:

```typescript
interface RoundData {
  round_number: number;          // Round sequence number (1-5)
  actual_lat: number;           // Actual location latitude (-90 to 90)
  actual_lng: number;           // Actual location longitude (-180 to 180)
  guess_lat: number;            // User guess latitude (-90 to 90)
  guess_lng: number;            // User guess longitude (-180 to 180)
  actual_country_code: string;  // ISO country code (uppercase)
  country_guess: string;        // User's country guess (uppercase)
  score: number;                // Round score (0-5000)
  distance_km: number;          // Distance between actual and guess (km)
  time_taken: number;           // Time taken in seconds
  is_correct_country: boolean;  // Whether country guess was correct
  game: {
    map_name: string;           // Name of the map played
    game_mode: string;          // Game mode (standard, battle_royale, etc.)
    total_score: number;        // Total game score
    played_at: string;          // Game timestamp (ISO 8601)
  };
}
```

### Country Performance Model

Used in `/api/map/countries` responses:

```typescript
interface CountryPerformance {
  country_code: string;         // ISO country code (uppercase)
  totalRounds: number;          // Total rounds played in this country
  correctGuesses: number;       // Number of correct country guesses
  accuracy: number;             // Accuracy percentage (0-100)
  avgScore: number;             // Average score for this country
  totalScore: number;           // Total points scored in this country
  avgDistance: number;          // Average distance in kilometers
  minDistance: number;          // Best (minimum) distance
  maxDistance: number;          // Worst (maximum) distance
  perfectScores: number;        // Number of perfect scores (5000 points)
  perfectRate: number;          // Perfect score rate percentage
}
```

---

## Response Formats

### Success Response Format

All successful API responses follow this structure:

```json
{
  "success": true,
  "data": {}, // or []
  "meta": {
    // Additional metadata
  }
}
```

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "statusCode": 400
}
```

### Pagination Format

Endpoints that support pagination include this structure:

```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "pages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Examples

### Frontend Integration Examples

#### Interactive Map Visualization

```javascript
// Fetch rounds data for map visualization
const fetchMapData = async (userId, filters = {}) => {
  const params = new URLSearchParams({
    userId,
    page: 1,
    limit: 500,
    ...filters
  });
  
  const response = await fetch(`/api/map/rounds?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data.rounds.map(round => ({
      actual: [round.actual_lng, round.actual_lat],
      guess: [round.guess_lng, round.guess_lat],
      score: round.score,
      distance: round.distance_km,
      country: round.actual_country_code,
      isCorrect: round.is_correct_country
    }));
  }
  
  throw new Error(data.error);
};

// Usage with Leaflet.js
const rounds = await fetchMapData('5feb86db892bf00001a9de92');
rounds.forEach(round => {
  // Add actual location marker
  L.marker(round.actual).addTo(map);
  
  // Add guess location marker
  L.marker(round.guess, { color: 'red' }).addTo(map);
  
  // Add connection line
  L.polyline([round.actual, round.guess], {
    color: round.score > 4000 ? 'green' : 'red',
    weight: 2
  }).addTo(map);
});
```

#### Country Performance Choropleth

```javascript
// Fetch country performance data
const fetchCountryData = async (userId) => {
  const response = await fetch(`/api/map/countries?userId=${userId}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data.reduce((acc, country) => {
      acc[country.country_code] = {
        accuracy: country.accuracy,
        totalRounds: country.totalRounds,
        avgScore: country.avgScore
      };
      return acc;
    }, {});
  }
  
  throw new Error(data.error);
};

// Usage with choropleth coloring
const countryData = await fetchCountryData('5feb86db892bf00001a9de92');
Object.entries(countryData).forEach(([countryCode, stats]) => {
  const color = getColorByAccuracy(stats.accuracy);
  colorCountry(countryCode, color);
});
```

#### Score-based Filtering

```javascript
// Filter rounds by score range for different visualizations
const getHighScoreRounds = async (userId) => {
  const response = await fetch(`/api/map/rounds?userId=${userId}&minScore=4000`);
  return response.json();
};

const getMediumScoreRounds = async (userId) => {
  const response = await fetch(`/api/map/rounds?userId=${userId}&minScore=2000&maxScore=3999`);
  return response.json();
};

const getLowScoreRounds = async (userId) => {
  const response = await fetch(`/api/map/rounds?userId=${userId}&maxScore=1999`);
  return response.json();
};
```

#### Date Range Analysis

```javascript
// Analyze performance over time
const getMonthlyPerformance = async (userId, year, month) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
  
  const response = await fetch(
    `/api/map/rounds?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
  );
  
  return response.json();
};
```

---

## Development & Testing

### Running the API

```bash
# Development mode
cd backend
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test
npm run test:api
```

### API Testing with curl

```bash
# Test health endpoint
curl -X GET http://localhost:3000/health

# Test API documentation
curl -X GET http://localhost:3000/api

# Test map rounds endpoint
curl -X GET "http://localhost:3000/api/map/rounds?userId=5feb86db892bf00001a9de92&limit=5" \
  -H "Accept: application/json"

# Test country performance endpoint
curl -X GET "http://localhost:3000/api/map/countries?userId=5feb86db892bf00001a9de92" \
  -H "Accept: application/json"
```

---

## Security Considerations

### Current Implementation

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domains
- **Helmet**: Security headers automatically applied
- **Input Validation**: Basic parameter validation
- **Error Handling**: Sensitive information not exposed

### Future Enhancements

- Authentication middleware
- Request logging and monitoring
- Input sanitization
- API key management
- Role-based access control

---

## Performance Notes

### Optimization Features

- **Pagination**: Prevents large data transfers
- **Indexing**: Database indexes on frequently queried fields
- **Aggregation**: Efficient database queries
- **Response Compression**: Gzip compression enabled

### Recommended Usage

- Use pagination for large datasets
- Implement client-side caching
- Filter data appropriately to reduce response size
- Use specific date ranges rather than requesting all data

---

## Changelog

### Version 1.0.0 (Current)
- Initial API implementation
- Map data endpoints
- Health and documentation endpoints
- Basic error handling and rate limiting
- Comprehensive test suite

### Planned Features
- Authentication endpoints (`/api/auth/*`)
- Statistics endpoints (`/api/stats/*`)
- Game management endpoints (`/api/games/*`)
- Data synchronization endpoints (`/api/sync/*`)
- WebSocket support for real-time updates

---

## Support

For issues, questions, or contributions:

- **GitHub Repository**: [Link to repository]
- **Documentation**: This file and `/api` endpoint
- **Testing**: Comprehensive test suite included
- **Examples**: See examples section above

---

*Last Updated: January 15, 2024*  
*API Version: 1.0.0*
