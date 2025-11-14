import { describe, it, expect } from '@jest/globals';
import { validateBrunoRequest } from '../../../src/validators/brunoValidator.js';
import { BrunoRequest } from '../../../src/types/bruno.types.js';

describe('brunoValidator', () => {
  describe('validateBrunoRequest', () => {
    it('should validate a valid Bruno request', () => {
      const validRequest: BrunoRequest = {
        meta: {
          name: 'Test Request',
          type: 'http',
          seq: 1,
        },
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        queryParams: [],
        pathParams: [],
      };

      const result = validateBrunoRequest(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should validate request with headers', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'POST',
        url: 'https://api.example.com',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
          { key: 'Authorization', value: 'Bearer token', enabled: true },
        ],
        queryParams: [],
        pathParams: [],
      };

      const result = validateBrunoRequest(request);
      expect(result.headers).toHaveLength(2);
    });

    it('should validate request with query parameters', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [
          { key: 'page', value: '1', enabled: true },
          { key: 'limit', value: '10', enabled: true },
        ],
        pathParams: [],
      };

      const result = validateBrunoRequest(request);
      expect(result.queryParams).toHaveLength(2);
    });

    it('should validate request with JSON body', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'POST',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        pathParams: [],
        body: {
          mode: 'json',
          content: '{"name": "John"}',
        },
      };

      const result = validateBrunoRequest(request);
      expect(result.body?.mode).toBe('json');
    });

    it('should validate request with bearer auth', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        pathParams: [],
        auth: {
          type: 'bearer',
          bearer: { token: 'mytoken123' },
        },
      };

      const result = validateBrunoRequest(request);
      expect(result.auth?.type).toBe('bearer');
      expect(result.auth?.bearer?.token).toBe('mytoken123');
    });

    it('should throw error for missing meta', () => {
      const invalidRequest = {
        method: 'GET',
        url: 'https://api.example.com',
      };

      expect(() => validateBrunoRequest(invalidRequest)).toThrow();
    });

    it('should throw error for invalid HTTP method', () => {
      const invalidRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'INVALID',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        pathParams: [],
      };

      expect(() => validateBrunoRequest(invalidRequest)).toThrow();
    });

    it('should throw error for missing URL', () => {
      const invalidRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'GET',
        headers: [],
        queryParams: [],
        pathParams: [],
      };

      expect(() => validateBrunoRequest(invalidRequest)).toThrow();
    });

    it('should accept request with scripts', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        pathParams: [],
        preRequestScript: 'console.log("pre-request");',
        testScript: 'console.log("test");',
      };

      const result = validateBrunoRequest(request);
      expect(result.preRequestScript).toBeDefined();
      expect(result.testScript).toBeDefined();
    });

    it('should accept request with documentation', () => {
      const request: BrunoRequest = {
        meta: { name: 'Test', type: 'http' },
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        pathParams: [],
        docs: 'This endpoint returns user data',
      };

      const result = validateBrunoRequest(request);
      expect(result.docs).toBe('This endpoint returns user data');
    });
  });
});
