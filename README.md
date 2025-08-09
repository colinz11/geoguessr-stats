# GeoGuessr Stats

A full-stack TypeScript application for analyzing GeoGuessr game statistics with MongoDB storage and React frontend.

## Project Structure

```
geoguessr-stats/
├── backend/                 # Node.js TypeScript backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # MongoDB models
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Database utilities
│   │   └── __tests__/      # Test files
│   └── package.json
├── frontend/                # React TypeScript frontend (Phase 4)
│   └── (to be implemented)
├── docs/                    # Project documentation
│   ├── DATA_MODEL.md
│   ├── REQUIREMENTS.md
│   └── IMPLEMENTATION_*.md
└── package.json            # Root monorepo scripts
```

## Phase 1 Complete ✅

**Backend: Data Models & MongoDB Integration**
- ✅ TypeScript project setup with strict configuration
- ✅ MongoDB connection with Mongoose ODM
- ✅ Complete data models (Users, Games, Rounds)
- ✅ Database indexes for performance (27 total)
- ✅ Utility functions for CRUD operations
- ✅ Test setup with Jest
- ✅ Development environment configuration

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up backend environment:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your MongoDB URI
   ```

3. **Start development servers:**
   ```bash
   # Backend only (Phase 1)
   npm run dev:backend
   
   # Or when frontend is ready (Phase 4)
   npm run dev:frontend   # In another terminal
   ```

4. **Run tests:**
   ```bash
   npm run test:backend
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

## Data Model Overview

### Collections

1. **Users** - Authentication and user data
   - Cookie-based GeoGuessr authentication
   - Session validation and expiry tracking

2. **Games** - Game metadata and settings
   - Feed data (basic info) from `/api/v4/feed/private`
   - Detailed metadata from `/api/v3/games/{token}`
   - Game constraints (NMPZ, timed, etc.)

3. **Rounds** - Individual round performance
   - Guess vs actual coordinates
   - Performance metrics and scoring
   - Country identification accuracy

### Key Features

- **Efficient Indexing**: Optimized for statistics queries
- **Type Safety**: Full TypeScript coverage
- **Validation**: Mongoose schema validation
- **Utilities**: Helper functions for common operations
- **Testing**: Jest test suite with database mocking

## Available Scripts

### Root Level (Monorepo)
```bash
npm run install:all     # Install all dependencies
npm run dev:backend     # Start backend development
npm run dev:frontend    # Start frontend development  
npm run build:all       # Build all projects
npm run test:all        # Run all tests
npm run lint:all        # Lint all projects
```

### Backend Specific
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
```

## Next Steps

**Phase 2: GeoGuessr API Integration**
- Cookie-based authentication client
- Feed API pagination handling
- Game details fetching
- Data parsing and storage

**Phase 3: Backend API Development**
- REST API endpoints
- Statistics calculations
- Authentication middleware
- Request validation

**Phase 4: Frontend Development**
- React TypeScript application
- Data visualization
- User interface
- Responsive design

## Development Notes

- **Strict TypeScript**: Full type safety enabled
- **Database Utilities**: Helper functions in `utils/database.ts`
- **Model Methods**: Instance and static methods for common operations
- **Aggregation**: Optimized MongoDB aggregation pipelines
- **Testing**: Comprehensive test coverage with Jest

## Database Schema

The database follows a normalized design with separate collections for Users, Games, and Rounds, optimized for analytics queries and statistics calculations.

See `DATA_MODEL.md` for complete schema documentation.

---

*Phase 1 Complete: Data models and MongoDB integration working! 🚀*
