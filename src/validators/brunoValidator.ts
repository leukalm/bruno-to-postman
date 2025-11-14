import { BrunoRequest, BrunoRequestSchema } from '../types/bruno.types.js';
import { ZodError } from 'zod';

/**
 * Validate a Bruno request against the schema
 * @param request - The request object to validate
 * @returns The validated Bruno request
 * @throws Error if validation fails
 */
export function validateBrunoRequest(request: unknown): BrunoRequest {
  try {
    return BrunoRequestSchema.parse(request);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Bruno request validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}
