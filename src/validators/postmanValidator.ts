import { ZodError } from 'zod';
import { PostmanCollectionSchema, type PostmanCollection } from '../types/postman.types.js';

/**
 * Validate a Postman collection against the schema
 * @param collection - The collection to validate
 * @returns The validated collection
 * @throws Error if validation fails with detailed error messages
 */
export function validatePostmanCollection(collection: unknown): PostmanCollection {
  try {
    return PostmanCollectionSchema.parse(collection);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Postman collection validation failed:\n${errors.join('\n')}`);
    }
    throw error;
  }
}
