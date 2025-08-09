import request from 'supertest';
import app from '../../app';

describe('API Documentation Endpoints', () => {
  describe('GET /api/docs', () => {
    it('should return comprehensive API documentation in JSON format', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'GeoGuessr Stats API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('baseUrl');
      expect(response.body).toHaveProperty('documentation');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('examples');
      expect(response.body).toHaveProperty('dataModels');
      expect(response.body).toHaveProperty('httpStatusCodes');
      expect(response.body).toHaveProperty('rateLimiting');
      expect(response.body).toHaveProperty('security');
      expect(response.body).toHaveProperty('meta');
    });

    it('should include all endpoint documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { endpoints } = response.body;
      expect(endpoints).toHaveProperty('health');
      expect(endpoints).toHaveProperty('apiInfo');
      expect(endpoints).toHaveProperty('mapRounds');
      expect(endpoints).toHaveProperty('mapCountries');

      // Check mapRounds endpoint documentation
      expect(endpoints.mapRounds).toHaveProperty('url', '/api/map/rounds');
      expect(endpoints.mapRounds).toHaveProperty('method', 'GET');
      expect(endpoints.mapRounds).toHaveProperty('description');
      expect(endpoints.mapRounds).toHaveProperty('parameters');
      expect(endpoints.mapRounds.parameters).toHaveProperty('userId');
      expect(endpoints.mapRounds.parameters).toHaveProperty('page');
      expect(endpoints.mapRounds.parameters).toHaveProperty('limit');
    });

    it('should include data models documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { dataModels } = response.body;
      expect(dataModels).toHaveProperty('roundData');
      expect(dataModels).toHaveProperty('countryPerformance');

      // Check round data model
      expect(dataModels.roundData).toHaveProperty('description');
      expect(dataModels.roundData).toHaveProperty('fields');
      expect(dataModels.roundData.fields).toHaveProperty('round_number');
      expect(dataModels.roundData.fields).toHaveProperty('actual_lat');
      expect(dataModels.roundData.fields).toHaveProperty('actual_lng');
      expect(dataModels.roundData.fields).toHaveProperty('game');

      // Check country performance model
      expect(dataModels.countryPerformance).toHaveProperty('description');
      expect(dataModels.countryPerformance).toHaveProperty('fields');
      expect(dataModels.countryPerformance.fields).toHaveProperty('country_code');
      expect(dataModels.countryPerformance.fields).toHaveProperty('accuracy');
      expect(dataModels.countryPerformance.fields).toHaveProperty('totalRounds');
    });

    it('should include practical examples', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { examples } = response.body;
      expect(examples).toHaveProperty('healthCheck');
      expect(examples).toHaveProperty('mapRoundsBasic');
      expect(examples).toHaveProperty('mapRoundsFiltered');
      expect(examples).toHaveProperty('countryPerformance');

      // Check example structure
      expect(examples.healthCheck).toHaveProperty('request');
      expect(examples.healthCheck).toHaveProperty('curl');
      expect(examples.mapRoundsBasic).toHaveProperty('request');
      expect(examples.mapRoundsBasic).toHaveProperty('curl');
    });
  });

  describe('GET /api/docs/interactive', () => {
    it('should return interactive HTML documentation', async () => {
      const response = await request(app)
        .get('/api/docs/interactive')
        .expect(200)
        .expect('Content-Type', /text\/html/);

      expect(response.text).toContain('GeoGuessr Stats API Documentation');
      expect(response.text).toContain('Interactive Map Data');
      expect(response.text).toContain('Country Performance');
      expect(response.text).toContain('/api/map/rounds');
      expect(response.text).toContain('/api/map/countries');
      expect(response.text).toContain('Try it!');
    });

    it('should include navigation and styling', async () => {
      const response = await request(app)
        .get('/api/docs/interactive')
        .expect(200);

      expect(response.text).toContain('<nav');
      expect(response.text).toContain('<style>');
      expect(response.text).toContain('tryEndpoint');
      expect(response.text).toContain('Overview');
      expect(response.text).toContain('Endpoints');
      expect(response.text).toContain('Examples');
    });
  });

  describe('GET /api/docs/markdown', () => {
    it('should attempt to serve markdown documentation', async () => {
      const response = await request(app)
        .get('/api/docs/markdown');

      // Should either return HTML content or 404 if file doesn't exist
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('GeoGuessr Stats API');
      } else {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('GET /api/docs/quick', () => {
    it('should return quick reference documentation', async () => {
      const response = await request(app)
        .get('/api/docs/quick')
        .expect(200);

      expect(response.body).toHaveProperty('title', 'GeoGuessr Stats API - Quick Reference');
      expect(response.body).toHaveProperty('baseUrl');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('commonUseCases');
      expect(response.body).toHaveProperty('dataFlow');
      expect(response.body).toHaveProperty('responseStructure');
    });

    it('should include endpoint examples with curl commands', async () => {
      const response = await request(app)
        .get('/api/docs/quick')
        .expect(200);

      const { endpoints } = response.body;
      expect(endpoints).toBeInstanceOf(Array);
      expect(endpoints.length).toBeGreaterThan(0);

      endpoints.forEach((endpoint: any) => {
        expect(endpoint).toHaveProperty('name');
        expect(endpoint).toHaveProperty('method');
        expect(endpoint).toHaveProperty('url');
        expect(endpoint).toHaveProperty('example');
        expect(endpoint.example).toContain('curl');
      });
    });

    it('should include common use cases for frontend development', async () => {
      const response = await request(app)
        .get('/api/docs/quick')
        .expect(200);

      const { commonUseCases } = response.body;
      expect(commonUseCases).toBeInstanceOf(Array);
      expect(commonUseCases.length).toBeGreaterThan(0);

      commonUseCases.forEach((useCase: any) => {
        expect(useCase).toHaveProperty('task');
        expect(useCase).toHaveProperty('endpoint');
        expect(useCase).toHaveProperty('description');
      });

      // Check for map-specific use cases
      const mapVisualization = commonUseCases.find((uc: any) => uc.task.includes('map visualization'));
      const choropleth = commonUseCases.find((uc: any) => uc.task.includes('choropleth'));
      
      expect(mapVisualization).toBeDefined();
      expect(choropleth).toBeDefined();
    });

    it('should include data flow explanation', async () => {
      const response = await request(app)
        .get('/api/docs/quick')
        .expect(200);

      const { dataFlow } = response.body;
      expect(dataFlow).toHaveProperty('step1');
      expect(dataFlow).toHaveProperty('step2');
      expect(dataFlow).toHaveProperty('step3');
      expect(dataFlow).toHaveProperty('step4');
      expect(dataFlow).toHaveProperty('step5');

      expect(dataFlow.step1).toContain('/api/map/rounds');
      expect(dataFlow.step2).toContain('actual_lat');
      expect(dataFlow.step2).toContain('guess_lat');
    });
  });

  describe('Updated /api endpoint', () => {
    it('should include documentation links', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('documentation');
      expect(response.body.documentation).toHaveProperty('interactive', '/api/docs/interactive');
      expect(response.body.documentation).toHaveProperty('full', '/api/docs/markdown');
      expect(response.body.documentation).toHaveProperty('quick', '/api/docs/quick');
      expect(response.body.documentation).toHaveProperty('json', '/api/docs');
    });

    it('should include quickStart URLs', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('quickStart');
      expect(response.body.quickStart).toHaveProperty('healthCheck');
      expect(response.body.quickStart).toHaveProperty('documentation');
      expect(response.body.quickStart).toHaveProperty('mapData');

      // URLs should be absolute
      expect(response.body.quickStart.healthCheck).toMatch(/^https?:\/\//);
      expect(response.body.quickStart.documentation).toMatch(/^https?:\/\//);
      expect(response.body.quickStart.mapData).toMatch(/^https?:\/\//);
    });

    it('should include documentation feature in features list', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.features).toHaveProperty('API Documentation', '/api/docs/interactive');
      expect(response.body.endpoints).toHaveProperty('docs', '/api/docs');
    });
  });

  describe('Content Validation', () => {
    it('should provide comprehensive parameter documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const roundsParams = response.body.endpoints.mapRounds.parameters;
      const countriesParams = response.body.endpoints.mapCountries.parameters;

      // Check essential map visualization parameters
      expect(roundsParams.userId).toContain('User ID');
      expect(roundsParams.page).toContain('Page number');
      expect(roundsParams.limit).toContain('Results per page');
      expect(roundsParams.minScore).toContain('Minimum round score');
      expect(roundsParams.countries).toContain('country codes');
      expect(roundsParams.startDate).toContain('ISO 8601');

      expect(countriesParams.userId).toContain('User ID');
      expect(countriesParams.minRounds).toContain('Minimum rounds');
      expect(countriesParams.sortBy).toContain('accuracy');
    });

    it('should include HTTP status codes documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { httpStatusCodes } = response.body;
      expect(httpStatusCodes).toHaveProperty('200', 'Success');
      expect(httpStatusCodes).toHaveProperty('400');
      expect(httpStatusCodes).toHaveProperty('404');
      expect(httpStatusCodes).toHaveProperty('500');
    });

    it('should include rate limiting information', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { rateLimiting } = response.body;
      expect(rateLimiting).toHaveProperty('limit');
      expect(rateLimiting).toHaveProperty('exceeded');
      expect(rateLimiting).toHaveProperty('headers');
      expect(rateLimiting.limit).toContain('100 requests per 15 minutes');
    });

    it('should include security information', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      const { security } = response.body;
      expect(security).toHaveProperty('current');
      expect(security).toHaveProperty('planned');
      expect(security.current).toBeInstanceOf(Array);
      expect(security.planned).toBeInstanceOf(Array);
      expect(security.current.length).toBeGreaterThan(0);
    });
  });
});
