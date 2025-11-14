import { describe, it, expect } from '@jest/globals';
import { parseUrl } from '../../../src/utils/urlParser.js';

describe('urlParser', () => {
  describe('parseUrl', () => {
    it('should parse simple URL', () => {
      const result = parseUrl('https://api.example.com/users');

      expect(result.raw).toBe('https://api.example.com/users');
      expect(result.protocol).toBe('https');
      expect(result.host).toEqual(['api.example.com']);
      expect(result.path).toEqual(['users']);
      expect(result.query).toEqual([]);
    });

    it('should parse URL with query parameters', () => {
      const result = parseUrl('https://api.example.com/users?page=1&limit=10');

      expect(result.query).toEqual([
        { key: 'page', value: '1' },
        { key: 'limit', value: '10' },
      ]);
    });

    it('should parse URL with path segments', () => {
      const result = parseUrl('https://api.example.com/v1/users/123/profile');

      expect(result.path).toEqual(['v1', 'users', '123', 'profile']);
    });

    it('should preserve {{variables}} in URL', () => {
      const result = parseUrl('{{baseUrl}}/api/users/{{userId}}');

      expect(result.raw).toBe('{{baseUrl}}/api/users/{{userId}}');
      expect(result.variables).toContain('baseUrl');
      expect(result.variables).toContain('userId');
    });

    it('should extract variables from host', () => {
      const result = parseUrl('https://{{subdomain}}.example.com/users');

      expect(result.variables).toContain('subdomain');
      expect(result.host).toEqual(['{{subdomain}}.example.com']);
    });

    it('should extract variables from path', () => {
      const result = parseUrl('https://api.example.com/users/{{id}}/posts/{{postId}}');

      expect(result.variables).toContain('id');
      expect(result.variables).toContain('postId');
    });

    it('should extract variables from query parameters', () => {
      const result = parseUrl('https://api.example.com/users?token={{authToken}}&page={{pageNum}}');

      expect(result.variables).toContain('authToken');
      expect(result.variables).toContain('pageNum');
    });

    it('should handle URL with port', () => {
      const result = parseUrl('https://api.example.com:8080/users');

      expect(result.port).toBe('8080');
    });

    it('should handle URL with hash', () => {
      const result = parseUrl('https://api.example.com/docs#section-1');

      expect(result.hash).toBe('section-1');
    });

    it('should handle URL without protocol', () => {
      const result = parseUrl('api.example.com/users');

      expect(result.protocol).toBeUndefined();
      expect(result.host).toEqual(['api.example.com']);
    });

    it('should handle localhost URLs', () => {
      const result = parseUrl('http://localhost:3000/api/users');

      expect(result.protocol).toBe('http');
      expect(result.host).toEqual(['localhost']);
      expect(result.port).toBe('3000');
      expect(result.path).toEqual(['api', 'users']);
    });

    it('should handle complex URL with everything', () => {
      const result = parseUrl(
        'https://{{env}}.api.example.com:8443/v1/users/{{userId}}?include=profile&limit={{limit}}#details'
      );

      expect(result.protocol).toBe('https');
      expect(result.port).toBe('8443');
      expect(result.hash).toBe('details');
      expect(result.variables).toContain('env');
      expect(result.variables).toContain('userId');
      expect(result.variables).toContain('limit');
      expect(result.query).toHaveLength(2);
    });

    it('should handle URL with encoded characters', () => {
      const result = parseUrl('https://api.example.com/search?q=hello%20world');

      expect(result.query[0]).toEqual({ key: 'q', value: 'hello%20world' });
    });

    it('should handle empty path', () => {
      const result = parseUrl('https://api.example.com');

      expect(result.path).toEqual([]);
    });

    it('should handle trailing slash', () => {
      const result = parseUrl('https://api.example.com/users/');

      expect(result.path).toEqual(['users']);
    });
  });
});
