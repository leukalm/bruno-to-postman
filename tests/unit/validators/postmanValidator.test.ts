import { describe, it, expect } from '@jest/globals';
import { validatePostmanCollection } from '../../../src/validators/postmanValidator.js';

describe('postmanValidator', () => {
  describe('validatePostmanCollection', () => {
    it('should validate a valid minimal collection', () => {
      const collection = {
        info: {
          name: 'Test Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
      };

      const result = validatePostmanCollection(collection);

      expect(result).toEqual(collection);
    });

    it('should validate collection with single item', () => {
      const collection = {
        info: {
          name: 'API Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Get Users',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: 'https://api.example.com/users',
                protocol: 'https',
                host: ['api.example.com'],
                path: ['users'],
              },
            },
          },
        ],
      };

      const result = validatePostmanCollection(collection);

      expect(result.item).toHaveLength(1);
      expect(result.item[0].name).toBe('Get Users');
    });

    it('should validate collection with body', () => {
      const collection = {
        info: {
          name: 'Test',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Create User',
            request: {
              method: 'POST',
              header: [],
              url: {
                raw: 'https://api.example.com/users',
                protocol: 'https',
                host: ['api.example.com'],
                path: ['users'],
              },
              body: {
                mode: 'raw',
                raw: '{"name": "John"}',
                options: {
                  raw: {
                    language: 'json',
                  },
                },
              },
            },
          },
        ],
      };

      const result = validatePostmanCollection(collection);

      expect(result.item[0].request?.body?.mode).toBe('raw');
    });

    it('should validate collection with authentication', () => {
      const collection = {
        info: {
          name: 'Test',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Authenticated Request',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: 'https://api.example.com/protected',
                protocol: 'https',
                host: ['api.example.com'],
                path: ['protected'],
              },
              auth: {
                type: 'bearer',
                bearer: [
                  {
                    key: 'token',
                    value: 'mytoken',
                    type: 'string',
                  },
                ],
              },
            },
          },
        ],
      };

      const result = validatePostmanCollection(collection);

      expect(result.item[0].request?.auth?.type).toBe('bearer');
    });

    it('should validate collection with scripts', () => {
      const collection = {
        info: {
          name: 'Test',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Request with Scripts',
            request: {
              method: 'GET',
              header: [],
              url: {
                raw: 'https://api.example.com/test',
                protocol: 'https',
                host: ['api.example.com'],
                path: ['test'],
              },
            },
            event: [
              {
                listen: 'prerequest',
                script: {
                  type: 'text/javascript',
                  exec: ['console.log("pre-request");'],
                },
              },
              {
                listen: 'test',
                script: {
                  type: 'text/javascript',
                  exec: ['pm.test("Status is 200", function() {', '  pm.response.to.have.status(200);', '});'],
                },
              },
            ],
          },
        ],
      };

      const result = validatePostmanCollection(collection);

      expect(result.item[0].event).toHaveLength(2);
    });

    it('should throw error for missing info', () => {
      const invalid = {
        item: [],
      };

      expect(() => validatePostmanCollection(invalid)).toThrow('validation failed');
    });

    it('should throw error for missing name', () => {
      const invalid = {
        info: {
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
      };

      expect(() => validatePostmanCollection(invalid)).toThrow('validation failed');
    });

    it('should throw error for invalid item structure', () => {
      const invalid = {
        info: {
          name: 'Test',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            // Missing name and request
          },
        ],
      };

      expect(() => validatePostmanCollection(invalid)).toThrow('validation failed');
    });

    it('should throw error for invalid method', () => {
      const invalid = {
        info: {
          name: 'Test',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: 'Test',
            request: {
              method: 123, // method must be a string
              header: [],
              url: 'https://api.example.com',
            },
          },
        ],
      };

      expect(() => validatePostmanCollection(invalid)).toThrow('validation failed');
    });
  });
});
