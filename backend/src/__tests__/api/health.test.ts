import request from 'supertest';
import app from '../../app';

describe('Health Endpoint', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(typeof response.body.uptime).toBe('number');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should have correct content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });
});
