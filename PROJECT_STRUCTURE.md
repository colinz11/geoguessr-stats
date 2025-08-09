# GeoGuessr Stats - Project Structure

## Overview

This is a full-stack monorepo organized for clean separation between backend and frontend code.

```
geoguessr-stats/
├── 📁 backend/                    # Node.js TypeScript backend
│   ├── 📁 src/
│   │   ├── 📁 config/             # Database configuration
│   │   │   └── database.ts        # MongoDB connection setup
│   │   ├── 📁 models/             # Mongoose data models
│   │   │   ├── User.ts            # User model with auth
│   │   │   ├── Game.ts            # Game model with metadata
│   │   │   ├── Round.ts           # Round model for analytics
│   │   │   └── index.ts           # Model exports
│   │   ├── 📁 types/              # TypeScript interfaces
│   │   │   └── index.ts           # Type definitions
│   │   ├── 📁 utils/              # Helper utilities
│   │   │   └── database.ts        # Database CRUD helpers
│   │   ├── 📁 __tests__/          # Test files
│   │   │   ├── setup.ts           # Test configuration
│   │   │   └── models/            # Model tests
│   │   └── index.ts               # Main entry point
│   ├── 📁 dist/                   # Compiled JavaScript
│   ├── 📁 node_modules/           # Backend dependencies
│   ├── .env                       # Environment variables
│   ├── .eslintrc.js              # ESLint configuration
│   ├── jest.config.js            # Jest test config
│   ├── package.json              # Backend dependencies & scripts
│   ├── tsconfig.json             # TypeScript config
│   └── README.md                 # Backend documentation
├── 📁 frontend/                   # React TypeScript frontend (Phase 4)
│   └── (to be implemented)
├── 📁 docs/                       # Project documentation
│   ├── DATA_MODEL.md             # Database schema documentation
│   ├── REQUIREMENTS.md           # Project requirements
│   ├── IMPLEMENTATION_PLAN.md    # Development roadmap
│   └── IMPLEMENTATION_PROMPT.md  # Implementation guidelines
├── 📁 .git/                       # Git repository
├── package.json                   # Root monorepo scripts
├── README.md                      # Main project documentation
└── PROJECT_STRUCTURE.md          # This file
```

## Key Features

### 🎯 Backend (Phase 1 Complete)
- **Models**: 3 collections (Users, Games, Rounds)
- **Indexes**: 27 performance-optimized indexes
- **Virtual Fields**: 8 computed properties
- **Type Safety**: Full TypeScript coverage
- **Testing**: Jest test suite with database mocking
- **Utilities**: Helper functions for CRUD operations

### 🚀 Frontend (Phase 4 - Planned)
- **React**: TypeScript React application
- **Routing**: React Router for navigation
- **State**: Context API or Zustand for state management
- **UI**: Modern component library (Material-UI/Tailwind)
- **Charts**: Data visualization with Recharts/Chart.js
- **Maps**: Interactive maps for geographic analysis

### 📚 Documentation
- **Requirements**: Complete feature specifications
- **Data Model**: Database schema and relationships
- **Implementation**: Step-by-step development plan
- **API**: Integration strategy for GeoGuessr API

## Development Workflow

### Root Level Commands
```bash
npm run install:all     # Install all dependencies
npm run dev:backend     # Start backend development
npm run dev:frontend    # Start frontend development
npm run build:all       # Build all projects
npm run test:all        # Run all tests
npm run lint:all        # Lint all projects
```

### Backend Development
```bash
cd backend
npm run dev          # Development with hot reload
npm run build        # TypeScript compilation
npm test             # Run test suite
npm run lint         # Code quality checks
```

### Frontend Development (Future)
```bash
cd frontend
npm run dev          # Development with hot reload
npm run build        # Production build
npm test             # Run test suite
npm run lint         # Code quality checks
```

## Next Development Phases

### Phase 2: GeoGuessr API Integration
- Cookie-based authentication
- Feed API with token-based pagination
- Game details fetching and parsing
- Data synchronization services

### Phase 3: Backend API Development
- REST API endpoints
- Authentication middleware
- Statistics calculations
- Request validation and error handling

### Phase 4: Frontend Development
- React application with TypeScript
- User interface for statistics
- Data visualization components
- Responsive design for mobile/desktop

### Phase 5: Deployment
- Backend deployment (Vercel/Railway)
- Frontend deployment (Vercel)
- MongoDB Atlas configuration
- CI/CD pipeline setup

---

*This structure provides clean separation of concerns and scalable development workflow for the full-stack application.*
