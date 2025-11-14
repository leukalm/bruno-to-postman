import { describe, it, expect } from '@jest/globals';
import { convertBrunoToPostmanRequest } from '../../../src/converters/requestConverter.js';
import { parseBrunoFile } from '../../../src/parsers/brunoParser.js';
import { readFile } from '../../../src/services/fileService.js';
import { join } from 'path';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/bruno');

describe('requestConverter', () => {
  describe('convertBrunoToPostmanRequest', () => {
    it('should convert simple GET request', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.method).toBe('GET');
      expect(postmanRequest.url).toMatchObject({
        raw: 'https://api.example.com/users',
        protocol: 'https',
        host: ['api.example.com'],
        path: ['users'],
      });
      expect(postmanRequest.header).toEqual([]);
    });

    it('should convert POST request with JSON body', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.method).toBe('POST');
      expect(postmanRequest.body?.mode).toBe('raw');
      expect(postmanRequest.body?.raw).toContain('John Doe');
      expect(postmanRequest.body?.options?.raw?.language).toBe('json');
    });

    it('should convert headers correctly', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.header).toHaveLength(2);
      expect(postmanRequest.header[0]).toMatchObject({
        key: 'Content-Type',
        value: 'application/json',
        type: 'text',
      });
    });

    it('should convert query parameters', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      const url = postmanRequest.url as any;
      expect(url.query).toHaveLength(2);
      expect(url.query[0]).toMatchObject({
        key: 'include',
        value: 'profile',
      });
    });

    it('should preserve variables in URL', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      const url = postmanRequest.url as any;
      expect(url.raw).toContain('{{baseUrl}}');
      expect(url.raw).toContain('{{userId}}');
    });

    it('should convert bearer authentication', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'with-variables.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.auth?.type).toBe('bearer');
      expect(postmanRequest.auth?.bearer).toBeDefined();
      expect(postmanRequest.auth?.bearer?.[0].value).toBe('{{token}}');
    });

    it('should handle request without body', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.body).toBeUndefined();
    });

    it('should handle request without authentication', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const brunoRequest = parseBrunoFile(content);
      const postmanRequest = convertBrunoToPostmanRequest(brunoRequest);

      expect(postmanRequest.auth).toBeUndefined();
    });
  });
});
