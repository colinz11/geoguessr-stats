import '../setup';
import { GeoGuessrApiClient } from '../../services/geoguessrApi';
import SyncService from '../../services/syncService';
import { User, Round } from '../../models';
import { GeoGuessrGameDetails } from '../../types/geoguessr';

describe('SyncService', () => {
  it('saves rounds with normalized country codes', async () => {
    const user = await User.create({
      geoguessr_user_id: 'u1',
      username: 'tester',
      geoguessr_cookies: {
        session_cookie: 'cookie',
        expires_at: new Date(Date.now() + 1000 * 60 * 60)
      }
    });

    const apiClient: Partial<GeoGuessrApiClient> = {
      getAllGameTokens: jest.fn().mockResolvedValue(['game1']),
      getGameDetails: jest.fn().mockResolvedValue(mockGameDetails())
    };

    const service = new SyncService(apiClient as GeoGuessrApiClient, user);
    const result = await service.syncAllData();

    expect(result.success).toBe(true);
    expect(result.gamesProcessed).toBe(1);

    const round = await Round.findOne({});
    expect(round).toBeTruthy();
    expect(round!.actual_country_code).toBe('SE');
    expect(round!.country_guess).toBe('SE');
    expect(round!.is_correct_country).toBe(true);
  });
});

function mockGameDetails(): GeoGuessrGameDetails {
  return {
    token: 'game1',
    type: 'game',
    mode: 'standard',
    state: 'finished',
    roundCount: 1,
    timeLimit: 0,
    forbidMoving: false,
    forbidZooming: false,
    forbidRotating: false,
    map: 'world',
    mapName: 'World',
    panoramaProvider: 1,
    bounds: { min: { lat: 0, lng: 0 }, max: { lat: 1, lng: 1 } },
    round: 1,
    rounds: [
      {
        lat: 1,
        lng: 1,
        panoId: 'p',
        heading: 0,
        pitch: 0,
        zoom: 0,
        streakLocationCode: 'se',
        startTime: ''
      }
    ],
    player: {
      totalScore: { amount: '5000', unit: 'points', percentage: 100 },
      totalDistance: {
        meters: { amount: '0', unit: 'm' },
        miles: { amount: '0', unit: 'mi' }
      },
      totalDistanceInMeters: 0,
      totalStepsCount: 0,
      totalTime: 0,
      totalStreak: 0,
      guesses: [
        {
          lat: 1,
          lng: 1,
          timedOut: false,
          timedOutWithGuess: false,
          skippedRound: false,
          roundScore: { amount: '5000', unit: 'points', percentage: 100 },
          roundScoreInPercentage: 100,
          roundScoreInPoints: 5000,
          distance: {
            meters: { amount: '0', unit: 'm' },
            miles: { amount: '0', unit: 'mi' }
          },
          distanceInMeters: 0,
          stepsCount: 0,
          streakLocationCode: 'SE',
          time: 10
        }
      ],
      isLeader: false,
      currentPosition: 1,
      pin: { url: '', anchor: '', isDefault: true },
      newBadges: [],
      explorer: null,
      id: 'p1',
      nick: 'player',
      isVerified: false,
      flair: 0,
      countryCode: 'SE'
    },
    progressChange: null as any
  };
}
