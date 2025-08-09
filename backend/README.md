# GeoGuessr Stats - Backend

Node.js TypeScript backend with MongoDB for the GeoGuessr statistics analysis application.

## Features

- **TypeScript**: Full type safety with strict mode
- **MongoDB**: Database with Mongoose ODM
- **Data Models**: Users, Games, and Rounds collections
- **Statistics**: Advanced aggregation pipelines for analytics
- **Testing**: Jest test suite with database mocking
- **Validation**: Comprehensive schema validation

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your MongoDB URI

# Development
npm run dev

# Build
npm run build

# Test
npm test
```

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/geoguessr-stats
MONGODB_TEST_URI=mongodb://localhost:27017/geoguessr-stats-test

# Optional
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── config/
│   └── database.ts          # MongoDB connection
├── models/
│   ├── User.ts              # User model with auth
│   ├── Game.ts              # Game model with metadata
│   ├── Round.ts             # Round model for analytics
│   └── index.ts             # Model exports
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── database.ts          # Database utilities
└── __tests__/               # Test files
```

## Data Models

### Users
- Cookie-based GeoGuessr authentication
- Session validation and expiry tracking

### Games  
- Game metadata and settings
- Feed data from `/api/v4/feed/private`
- Detailed data from `/api/v3/games/{token}`

### Rounds
- Individual round performance
- Guess vs actual coordinates
- Country identification accuracy

## API Integration (Phase 2)

The backend will integrate with:
- **Feed API**: `/api/v4/feed/private` (token-based pagination)
- **Game Details**: `/api/v3/games/{gameToken}`

## Database

- **27 Indexes**: Optimized for analytics queries
- **8 Virtual Fields**: Computed properties
- **Validation**: Schema-level data validation
- **Aggregations**: Country stats, performance trends

## Scripts

```bash
npm run dev          # Development with nodemon
npm run build        # TypeScript compilation
npm run start        # Production server
npm test             # Jest test suite
npm run lint         # ESLint code quality
```

---

*Phase 1 Complete: Data models and MongoDB integration implemented and tested.*
