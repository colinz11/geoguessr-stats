import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
  body?: any;
  params?: any;
  query?: any;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const bodyValidation = validateObject(req.body, schema.body, 'body');
      errors.push(...bodyValidation);
    }

    // Validate request params
    if (schema.params) {
      const paramsValidation = validateObject(req.params, schema.params, 'params');
      errors.push(...paramsValidation);
    }

    // Validate query parameters
    if (schema.query) {
      const queryValidation = validateObject(req.query, schema.query, 'query');
      errors.push(...queryValidation);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

const validateObject = (obj: any, schema: any, location: string): string[] => {
  const errors: string[] = [];
  
  // Basic validation - can be extended with more sophisticated validation library
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    const ruleSet = rules as any;

    if (ruleSet.required && (value === undefined || value === null || value === '')) {
      errors.push(`${location}.${key} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (ruleSet.type && typeof value !== ruleSet.type) {
        errors.push(`${location}.${key} must be of type ${ruleSet.type}`);
      }

      if (ruleSet.min && value < ruleSet.min) {
        errors.push(`${location}.${key} must be at least ${ruleSet.min}`);
      }

      if (ruleSet.max && value > ruleSet.max) {
        errors.push(`${location}.${key} must be at most ${ruleSet.max}`);
      }

      if (ruleSet.enum && !ruleSet.enum.includes(value)) {
        errors.push(`${location}.${key} must be one of: ${ruleSet.enum.join(', ')}`);
      }

      if (ruleSet.pattern && !ruleSet.pattern.test(value)) {
        errors.push(`${location}.${key} format is invalid`);
      }
    }
  }

  return errors;
};

// Common validation schemas
export const schemas = {
  objectId: {
    type: 'string',
    pattern: /^[0-9a-fA-F]{24}$/,
    required: true
  },
  pagination: {
    page: { type: 'string', pattern: /^\d+$/ },
    limit: { type: 'string', pattern: /^\d+$/ },
    sort: { type: 'string' },
    order: { type: 'string', enum: ['asc', 'desc'] }
  },
  dateRange: {
    startDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ }
  }
};
