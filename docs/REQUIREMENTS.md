# GeoGuessr Stats Analyzer - Project Requirements

## Project Overview

A web application that connects to users' GeoGuessr accounts to analyze their gaming statistics, providing insights into performance patterns, geographical strengths/weaknesses, and areas for improvement.

## MVP Features

### 1. User Authentication
- **Cookie-based Authentication**: Users authenticate by providing GeoGuessr session cookies
- **Cookie Storage**: Securely store and manage GeoGuessr session cookies for API requests
- **Session Validation**: Validate cookie authenticity and handle expired sessions
- **Account Linking**: Link GeoGuessr account to the web application via cookie authentication

### 2. Data Collection
- **GeoGuessr API Integration**: Fetch user's game history and statistics using stored cookies
- **Batch Data Refresh**: Manual refresh button to sync latest game data from GeoGuessr API
- **Background Sync**: Optional automatic periodic syncing of game data
- **Game Data Sync**: Collect comprehensive game data including:
  - Guess locations (lat/lng coordinates)
  - Actual locations (lat/lng coordinates)
  - Scores per round
  - Game modes played
  - Timestamps
  - Distance calculations

### 3. Core Statistics Dashboard
- **Overview Stats**:
  - Total games played
  - Average score per game
  - Best/worst performances
  - Total distance from correct locations
  - Accuracy percentage

### 4. Geographical Performance Analysis
- **Performance by Region**: 
  - Average scores grouped by continent/country/region where user guessed
  - Identify geographical knowledge gaps
  - Heatmap visualization of performance

- **Country-wise Accuracy**:
  - Percentage of correct country identifications
  - List of strongest/weakest countries
  - Improvement recommendations

### 5. Data Filtering and Controls
- **Refresh Controls**: 
  - Manual refresh button for batch data synchronization
  - Loading indicators during data refresh
  - Last sync timestamp display

- **Filter Options**:
  - **Game Mode Filter**: Filter by Classic, Battle Royale, Duels, Explorer mode, etc.
  - **Time Period Filter**: Filter by date ranges (last week, month, year, custom range)
  - **Map/Location Filter**: Filter by specific map types or regions
  - **Score Range Filter**: Filter games by score thresholds
  - **Country Filter**: Focus analysis on specific countries or continents

### 6. Visual Analytics
- **Interactive Maps**: 
  - Show guess locations vs actual locations
  - Performance heatmaps by region
  - Geographic distribution of games played
  - Filter-responsive map updates

- **Charts and Graphs**:
  - Score distribution histograms
  - Performance trends over time
  - Accuracy by country bar charts
  - Game mode comparison charts

## Technical Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: CSS Modules or Styled Components
- **State Management**: React Context API or Redux Toolkit
- **Mapping**: Leaflet or Mapbox GL JS
- **Charts**: Chart.js or Recharts
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Cookie-based session management
- **API Integration**: Axios for GeoGuessr API calls with cookie authentication
- **Environment**: dotenv for configuration
- **Cookie Handling**: Secure cookie storage and validation middleware

### Development Tools
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Version Control**: Git
- **Package Manager**: npm or yarn

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId,
  geoguessr_user_id: string,
  username: string,
  email?: string,
  created_at: Date,
  last_sync: Date,
  geoguessr_cookies: {
    session_cookie: string,
    csrf_token?: string,
    expires_at: Date
  },
  settings: {
    sync_frequency: string,
    privacy_level: string,
    default_filters: {
      game_modes: string[],
      time_period: string
    }
  }
}
```

### Games Collection
```typescript
{
  _id: ObjectId,
  user_id: ObjectId,
  geoguessr_game_id: string,
  game_mode: string,
  total_score: number,
  rounds: [{
    round_number: number,
    guess_lat: number,
    guess_lng: number,
    actual_lat: number,
    actual_lng: number,
    score: number,
    distance_km: number,
    country_guess: string,
    country_actual: string,
    time_taken: number
  }],
  played_at: Date,
  synced_at: Date
}
```

### Statistics Collection (Aggregated Data)
```typescript
{
  _id: ObjectId,
  user_id: ObjectId,
  country_stats: [{
    country_code: string,
    country_name: string,
    games_played: number,
    correct_guesses: number,
    accuracy_percentage: number,
    average_score: number,
    average_distance_km: number
  }],
  region_stats: [{
    region_name: string,
    games_played: number,
    average_score: number,
    best_score: number,
    worst_score: number
  }],
  overall_stats: {
    total_games: number,
    average_score: number,
    best_game_score: number,
    total_distance_km: number,
    countries_identified: number,
    favorite_regions: string[]
  },
  last_updated: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with GeoGuessr session cookies
- `POST /api/auth/logout` - Logout user and clear stored cookies
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/validate-cookies` - Validate stored GeoGuessr cookies

### Data Sync
- `POST /api/sync/games` - Manual batch refresh of games from GeoGuessr API
- `GET /api/sync/status` - Get sync status and last refresh timestamp
- `POST /api/sync/refresh` - Trigger manual data refresh

### Statistics
- `GET /api/stats/overview` - Get overall statistics with filter parameters
- `GET /api/stats/countries` - Get country-wise performance with filters
- `GET /api/stats/regions` - Get regional performance with filters
- `GET /api/stats/trends` - Get performance trends over time with filters

### Games
- `GET /api/games` - Get user's game history with pagination and filters
- `GET /api/games/:id` - Get specific game details
- `GET /api/games/filters` - Get available filter options (game modes, date ranges, etc.)

## Future Enhancements (Post-MVP)

### Advanced Analytics
- **Performance Trends**: Track improvement over time
- **Difficulty Analysis**: Analyze performance by map difficulty
- **Streak Tracking**: Monitor winning/losing streaks
- **Comparative Analysis**: Compare with global averages

### Social Features
- **Friends Comparison**: Compare stats with friends
- **Leaderboards**: Regional and global leaderboards
- **Achievements**: Unlock achievements based on performance

### Enhanced Visualizations
- **3D Globe Visualization**: Interactive 3D representation of guesses
- **Animated Progress**: Show improvement animations over time
- **Custom Map Overlays**: User-defined regions for analysis

### Export and Sharing
- **Data Export**: Export statistics to CSV/JSON
- **Report Generation**: Generate PDF performance reports
- **Social Sharing**: Share achievements on social media

## Security Considerations

- **Data Encryption**: Encrypt sensitive data at rest and in transit
- **Rate Limiting**: Implement API rate limiting
- **Input Validation**: Validate all user inputs
- **CORS Configuration**: Proper CORS setup for API security
- **Environment Variables**: Secure storage of API keys and secrets

## Performance Requirements

- **Page Load Time**: < 3 seconds for initial load
- **Data Sync**: Background sync without blocking UI
- **Map Rendering**: Smooth map interactions with large datasets
- **Responsive Design**: Mobile-first approach for all screen sizes

## Deployment Strategy

### Development Environment
- Local MongoDB instance or MongoDB Atlas
- Environment variables for API configurations
- Hot reloading for development

### Production Environment
- **Frontend**: Deploy to Vercel (Next.js SSR/SSG support)
- **Backend**: Deploy to Vercel Serverless Functions or separate Node.js hosting
- **Database**: MongoDB Atlas
- **CDN**: Vercel Edge Network for static assets and faster content delivery

## Monitoring and Analytics

- **Error Tracking**: Implement error logging and monitoring
- **Performance Monitoring**: Track API response times and database queries
- **User Analytics**: Track user engagement and feature usage
- **Uptime Monitoring**: Ensure high availability

## Remaining Questions for Clarification

1. **Data Retention**: How long should we store user data? Any privacy considerations?

2. **Monetization**: Any plans for premium features or subscriptions?

3. **Mobile App**: Is a mobile application planned for the future?

4. **Multi-language Support**: Should the app support multiple languages?

5. **Offline Capabilities**: Any requirements for offline functionality?

6. **Cookie Security**: What level of encryption should we use for storing GeoGuessr cookies?

7. **Rate Limiting**: Should we implement rate limiting for the refresh button to prevent API abuse?

## Success Metrics

- **User Engagement**: Daily/Monthly active users
- **Data Accuracy**: Successful sync rates from GeoGuessr API
- **Performance**: Page load times and API response times
- **User Satisfaction**: User feedback and retention rates

---

*This requirements document serves as the foundation for the GeoGuessr Stats Analyzer project. It will be updated as the project evolves and new requirements are identified.*
