# GeoGuessr Stats Implementation Prompt

## Refined Implementation Request

**"I want you to implement a full-stack TypeScript GeoGuessr statistics web application following the detailed requirements and data model we've established. Please implement this project in the following structured phases, completing each phase entirely before moving to the next:**

### Phase 1: Project Setup & Data Models
**Objective**: Create a solid foundation with TypeScript, MongoDB schemas, and proper project structure.

**Specific Tasks**:
1. Initialize a Node.js TypeScript project with proper folder structure
2. Set up MongoDB connection with Mongoose ODM
3. Implement the three data models we designed: Users, Games, and Rounds collections
4. Add all the specified indexes for performance
5. Create database connection utilities and error handling
6. Set up development environment (ESLint, Prettier, dotenv)
7. Write basic tests for the data models

**Acceptance Criteria**:
- TypeScript compilation works without errors
- MongoDB connection established successfully
- All three collections (Users, Games, Rounds) implemented with proper schemas
- Database indexes created as specified in the data model
- Environment configuration working
- Basic CRUD operations tested for each model

### Phase 2: GeoGuessr API Integration
**Objective**: Build services to fetch, parse, and store GeoGuessr data using cookie authentication.

**Specific Tasks**:
1. Create GeoGuessr API client with cookie-based authentication
2. Implement feed endpoint integration (`/api/v4/feed/private`) with token-based pagination
3. Implement detailed game endpoint integration (`/api/v3/games/{gameToken}`)
4. Build data parsers to transform API responses into our schema format
5. Create two-phase sync strategy:
   - Phase 1: Use token-based pagination through feed to collect all game tokens
   - Phase 2: Fetch detailed data for each game token
6. Add manual refresh functionality with progress tracking for pagination
7. Implement error handling and rate limiting

**Acceptance Criteria**:
- Successfully authenticate with GeoGuessr using provided cookies
- Fetch game list from feed endpoint (`/api/v4/feed/private`) using token-based pagination
- Handle pagination tokens to collect all available games
- Fetch detailed game data from `/api/v3/games/{gameToken}` endpoint
- Parse and store games with proper metadata fields
- Create associated round records from detailed game data
- Handle API errors gracefully with retry logic
- Track sync progress and status (pages processed, games synced)

### Phase 3: Backend API Development
**Objective**: Create REST API endpoints for frontend consumption with proper authentication and data filtering.

**Specific Tasks**:
1. Set up Express.js server with TypeScript
2. Implement authentication endpoints (login, logout, profile, validate)
3. Create data sync endpoints (refresh, status)
4. Build statistics endpoints with filtering support:
   - Overview statistics
   - Country-wise performance
   - Performance trends over time
   - Games list with pagination and filters
5. Add middleware for validation, error handling, and logging
6. Implement request rate limiting

**Acceptance Criteria**:
- All API endpoints documented and working
- Cookie authentication flow complete
- Statistics calculations accurate and performant
- Filtering works for game mode, time period, countries
- Proper error responses and status codes
- Request validation and sanitization

### Phase 4: Frontend Development
**Objective**: Build a responsive React TypeScript application with data visualization and user-friendly interface.

**Specific Tasks**:
1. Initialize React TypeScript project with Vite
2. Set up routing, state management, and API client
3. Implement authentication flow (login with cookies, session management)
4. Create dashboard with overview statistics
5. Build manual refresh component with progress indicators
6. Implement filtering UI (dropdowns, date pickers)
7. Create country performance analysis with charts/tables
8. Add performance trends visualization
9. Build games history list with pagination
10. Make responsive design for mobile/desktop

**Acceptance Criteria**:
- Clean, modern UI that works on desktop and mobile
- Authentication flow complete with cookie management
- Manual refresh works with visual progress feedback
- Statistics display correctly with interactive charts
- Filtering updates data dynamically
- Error states and loading states handled gracefully
- Performance is smooth with large datasets

### Phase 5: Integration, Testing & Deployment
**Objective**: End-to-end testing, performance optimization, and production deployment.

**Specific Tasks**:
1. Integration testing of complete user flows
2. Performance optimization (query optimization, caching, bundle size)
3. Error handling and edge cases
4. Deploy backend to Vercel serverless functions
5. Deploy frontend to Vercel
6. Set up MongoDB Atlas for production
7. Configure environment variables and monitoring

**Acceptance Criteria**:
- Full user journey works end-to-end
- Performance targets met (< 3s load time, < 500ms API responses)
- Deployed to production with proper error monitoring
- Documentation complete for setup and usage

## Implementation Guidelines

### Code Quality Standards
- Use TypeScript strict mode
- Follow consistent naming conventions
- Add comprehensive error handling
- Write meaningful commit messages
- Include JSDoc comments for public APIs
- Implement proper logging

### Security Considerations
- Validate all user inputs
- Sanitize data before database operations
- Implement rate limiting
- Secure cookie storage and validation
- Use environment variables for secrets

### Performance Requirements
- Database queries must use proper indexes
- API responses should be under 500ms
- Frontend should load in under 3 seconds
- Implement pagination for large datasets
- Use caching where appropriate

## Expected Deliverables per Phase

1. **Phase 1**: Working database models with connection utilities
2. **Phase 2**: GeoGuessr API integration with data sync functionality
3. **Phase 3**: Complete REST API with all required endpoints
4. **Phase 4**: Fully functional React frontend application
5. **Phase 5**: Production-deployed application with monitoring

## How to Proceed

Please start with Phase 1 and implement it completely before moving to Phase 2. For each phase:

1. Show me the project structure you're creating
2. Implement all the code files needed
3. Test the functionality works as expected
4. Document any important decisions or trade-offs
5. Confirm the phase is complete before proceeding

Ask clarifying questions if anything is unclear about the requirements or implementation approach."

---

*This prompt provides clear, actionable guidance for implementing the GeoGuessr Stats application with proper phase gates and acceptance criteria.*
