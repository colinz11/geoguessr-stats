import request from 'supertest';
import app from '../../app';

describe('API Documentation Endpoint', () => {
  describe('GET /api', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'GeoGuessr Stats API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('features');
    });

    it('should include map endpoints in documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.endpoints).toHaveProperty('map', '/api/map');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
      expect(response.body.features).toHaveProperty('Interactive Map Data', '/api/map/rounds');
      expect(response.body.features).toHaveProperty('Country Performance', '/api/map/countries');
    });
  });
});
