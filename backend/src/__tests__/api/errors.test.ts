import request from 'supertest';
import app from '../../app';

describe('Error Handling', () => {
  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('availableEndpoints');
      expect(response.body.availableEndpoints).toHaveProperty('map', '/api/map');
    });

    it('should return 404 for invalid HTTP methods', async () => {
      const response = await request(app)
        .post('/health')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should return 404 for deeply nested non-existent routes', async () => {
      const response = await request(app)
        .get('/api/map/some/deep/nonexistent/path')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/map/rounds')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Helmet should add various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
    });
  });

  describe('Rate Limiting', () => {
    it('should accept normal request volume', async () => {
      // Make multiple requests quickly
      const promises = Array(5).fill(null).map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (rate limit is 100 per 15 minutes)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('JSON Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/map/rounds')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle JSON parsing errors
      expect(response.status).toBe(400);
    });

    it('should handle large request bodies', async () => {
      const largeData = 'x'.repeat(100000); // 100KB
      
      const response = await request(app)
        .post('/api/map/rounds')
        .send({ data: largeData });

      // Should not cause server crash (limit is 10MB)
      expect([200, 404, 405]).toContain(response.status);
    });
  });
});
