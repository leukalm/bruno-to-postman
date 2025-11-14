import { describe, it, expect } from '@jest/globals';
import { readFile } from '../../../src/services/fileService.js';
import { parseBrunoFile } from '../../../src/parsers/brunoParser.js';
import { join } from 'path';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/bruno');

describe('brunoParser', () => {
  describe('parseBrunoFile', () => {
    it('should parse simple GET request', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const result = parseBrunoFile(content);

      expect(result.meta.name).toBe('Get Users');
      expect(result.meta.type).toBe('http');
      expect(result.method).toBe('GET');
      expect(result.url).toBe('https://api.example.com/users');
    });

    it('should parse POST request with JSON body', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));
      const result = parseBrunoFile(content);

      expect(result.meta.name).toBe('Create User');
      expect(result.method).toBe('POST');
      expect(result.url).toBe('https://api.example.com/users');
      expect(result.body?.mode).toBe('json');
      expect(result.body?.content).toContain('John Doe');
    });

    it('should parse headers correctly', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));
      const result = parseBrunoFile(content);

      expect(result.headers).toHaveLength(2);
      expect(result.headers[0]).toEqual({
        key: 'Content-Type',
        value: 'application/json',
        enabled: true,
      });
      expect(result.headers[1]).toEqual({
        key: 'Accept',
        value: 'application/json',
        enabled: true,
      });
    });

    it('should parse query parameters', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const result = parseBrunoFile(content);

      expect(result.queryParams).toHaveLength(2);
      expect(result.queryParams[0]).toEqual({
        key: 'include',
        value: 'profile',
        enabled: true,
      });
      expect(result.queryParams[1]).toEqual({
        key: 'fields',
        value: 'name,email,avatar',
        enabled: true,
      });
    });

    it('should preserve variables in URLs', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const result = parseBrunoFile(content);

      expect(result.url).toBe('{{baseUrl}}/api/users/{{userId}}');
      expect(result.url).toContain('{{baseUrl}}');
      expect(result.url).toContain('{{userId}}');
    });

    it('should preserve variables in headers', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const result = parseBrunoFile(content);

      const authHeader = result.headers.find((h) => h.key === 'Authorization');
      expect(authHeader?.value).toBe('Bearer {{token}}');
    });

    it('should parse bearer authentication', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const result = parseBrunoFile(content);

      expect(result.auth?.type).toBe('bearer');
      expect(result.auth?.bearer?.token).toBe('{{token}}');
    });

    it('should throw error for invalid Bruno file (missing meta)', () => {
      const invalidContent = `
get {
  url: https://api.example.com
}
`;
      expect(() => parseBrunoFile(invalidContent)).toThrow('meta section');
    });

    it('should throw error for invalid Bruno file (missing HTTP method)', () => {
      const invalidContent = `
meta {
  name: Test
  type: http
}
`;
      expect(() => parseBrunoFile(invalidContent)).toThrow('HTTP method');
    });

    it('should handle empty sections gracefully', () => {
      const content = `
meta {
  name: Empty Request
  type: http
}

get {
  url: https://api.example.com
  body: none
  auth: none
}

headers {
}

params:query {
}
`;
      const result = parseBrunoFile(content);

      expect(result.headers).toEqual([]);
      expect(result.queryParams).toEqual([]);
    });

    it('should parse body with multiline JSON', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));
      const result = parseBrunoFile(content);

      expect(result.body?.content).toContain('"name": "John Doe"');
      expect(result.body?.content).toContain('"email": "john@example.com"');
      expect(result.body?.content).toContain('"age": 30');
    });
  });
});
