import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: '/api/auth',
      stats: '/api/stats',
      games: '/api/games',
      rounds: '/api/rounds',
      sync: '/api/sync',
      map: '/api/map'
    }
  });
};
