import '../setup';
import { User } from '../../models/User';
import { userUtils } from '../../utils/database';

describe('User Model', () => {
  const mockUserData = {
    geoguessr_user_id: '5feb86db892bf00001a9de92',
    username: 'TestUser',
    session_cookie: 'test-session-cookie-123',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };

  describe('Creation', () => {
    it('should create a user with valid data', async () => {
      const user = await userUtils.create(mockUserData);
      
      expect(user).toBeDefined();
      expect(user.geoguessr_user_id).toBe(mockUserData.geoguessr_user_id);
      expect(user.username).toBe(mockUserData.username);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.last_sync).toBeNull();
    });

    it('should not allow duplicate geoguessr_user_id', async () => {
      await userUtils.create(mockUserData);
      
      await expect(userUtils.create(mockUserData))
        .rejects
        .toThrow();
    });

    it('should require geoguessr_user_id', async () => {
      const invalidData = { ...mockUserData };
      delete (invalidData as any).geoguessr_user_id;
      
      await expect(userUtils.create(invalidData as any))
        .rejects
        .toThrow();
    });

    it('should require username', async () => {
      const invalidData = { ...mockUserData };
      delete (invalidData as any).username;
      
      await expect(userUtils.create(invalidData as any))
        .rejects
        .toThrow();
    });
  });

  describe('Instance Methods', () => {
    let user: any;

    beforeEach(async () => {
      user = await userUtils.create(mockUserData);
    });

    it('should validate session correctly', () => {
      expect(user.isSessionValid()).toBe(true);
      
      // Test expired session
      user.geoguessr_cookies.expires_at = new Date(Date.now() - 1000);
      expect(user.isSessionValid()).toBe(false);
    });

    it('should update last sync', async () => {
      const originalSync = user.last_sync;
      await user.updateLastSync();
      
      expect(user.last_sync).not.toBe(originalSync);
      expect(user.last_sync).toBeInstanceOf(Date);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await userUtils.create(mockUserData);
    });

    it('should find user by GeoGuessr ID', async () => {
      const foundUser = await User.findByGeoGuessrId(mockUserData.geoguessr_user_id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(mockUserData.username);
    });

    it('should find users with valid sessions', async () => {
      const validUsers = await User.findWithValidSession();
      
      expect(validUsers).toHaveLength(1);
      expect(validUsers[0]?.username).toBe(mockUserData.username);
    });

    it('should not find users with expired sessions', async () => {
      // Update user to have expired session
      await User.findOneAndUpdate(
        { geoguessr_user_id: mockUserData.geoguessr_user_id },
        { 'geoguessr_cookies.expires_at': new Date(Date.now() - 1000) }
      );

      const validUsers = await User.findWithValidSession();
      expect(validUsers).toHaveLength(0);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(async () => {
      await userUtils.create(mockUserData);
    });

    it('should update cookies', async () => {
      const user = await userUtils.findByGeoGuessrId(mockUserData.geoguessr_user_id);
      const newCookie = 'new-session-cookie';
      const newExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const updatedUser = await userUtils.updateCookies(user!._id, newCookie, newExpiry);
      
      expect(updatedUser).toBeDefined();
      // Note: cookies are not selected by default, so we need to fetch with select
      const userWithCookies = await User.findById(user!._id).select('+geoguessr_cookies');
      expect(userWithCookies?.geoguessr_cookies.session_cookie).toBe(newCookie);
      expect(userWithCookies?.geoguessr_cookies.expires_at).toEqual(newExpiry);
    });

    it('should update last sync via utility', async () => {
      const user = await userUtils.findByGeoGuessrId(mockUserData.geoguessr_user_id);
      const originalSync = user!.last_sync;
      
      const updatedUser = await userUtils.updateLastSync(user!._id);
      
      expect(updatedUser?.last_sync).not.toBe(originalSync);
      expect(updatedUser?.last_sync).toBeInstanceOf(Date);
    });
  });

  describe('JSON Serialization', () => {
    it('should not include sensitive data in JSON', async () => {
      const user = await userUtils.create(mockUserData);
      const json = user.toJSON();
      
      expect(json.geoguessr_cookies).toBeUndefined();
      expect(json.__v).toBeUndefined();
      expect(json.hasValidSession).toBeDefined();
    });
  });
});
