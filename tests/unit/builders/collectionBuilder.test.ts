import { describe, it, expect } from '@jest/globals';
import { buildPostmanCollection } from '../../../src/builders/collectionBuilder.js';
import { parseBrunoFile } from '../../../src/parsers/brunoParser.js';
import { readFile } from '../../../src/services/fileService.js';
import { join } from 'path';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/bruno');

describe('collectionBuilder', () => {
  describe('buildPostmanCollection', () => {
    it('should build collection with single request', async () => {
      const content = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const brunoRequest = parseBrunoFile(content);

      const collection = buildPostmanCollection('Test Collection', [
        {
          name: 'Get Users',
          request: brunoRequest,
        },
      ]);

      expect(collection.info.name).toBe('Test Collection');
      expect(collection.info.schema).toBe(
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      );
      expect(collection.item).toHaveLength(1);
      expect(collection.item[0].name).toBe('Get Users');
      expect(collection.item[0].request?.method).toBe('GET');
    });

    it('should build collection with multiple requests', async () => {
      const getContent = await readFile(join(FIXTURES_DIR, 'simple-get.bru'));
      const postContent = await readFile(join(FIXTURES_DIR, 'post-with-body.bru'));

      const getRequest = parseBrunoFile(getContent);
      const postRequest = parseBrunoFile(postContent);

      const collection = buildPostmanCollection('API Collection', [
        { name: 'Get Users', request: getRequest },
        { name: 'Create User', request: postRequest },
      ]);

      expect(collection.item).toHaveLength(2);
      expect(collection.item[0].name).toBe('Get Users');
      expect(collection.item[0].request?.method).toBe('GET');
      expect(collection.item[1].name).toBe('Create User');
      expect(collection.item[1].request?.method).toBe('POST');
    });

    it('should include pre-request scripts if present', async () => {
      const content = `meta {
  name: Test Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}

script:pre-request {
  bru.setVar("timestamp", Date.now());
}`;

      const brunoRequest = parseBrunoFile(content);
      const collection = buildPostmanCollection('Test Collection', [
        { name: 'Test', request: brunoRequest },
      ]);

      const item = collection.item[0];
      expect(item.event).toBeDefined();
      const preRequestEvent = item.event?.find((e: any) => e.listen === 'prerequest');
      expect(preRequestEvent).toBeDefined();
      expect(preRequestEvent?.script?.exec?.join('\n')).toContain('pm.environment.set');
    });

    it('should include test scripts if present', async () => {
      const content = `meta {
  name: Test Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}

script:test {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
}`;

      const brunoRequest = parseBrunoFile(content);
      const collection = buildPostmanCollection('Test Collection', [
        { name: 'Test', request: brunoRequest },
      ]);

      const item = collection.item[0];
      expect(item.event).toBeDefined();
      const testEvent = item.event?.find((e: any) => e.listen === 'test');
      expect(testEvent).toBeDefined();
      expect(testEvent?.script?.exec?.join('\n')).toContain('pm.response.code');
    });

    it('should handle empty request list', () => {
      const collection = buildPostmanCollection('Empty Collection', []);

      expect(collection.info.name).toBe('Empty Collection');
      expect(collection.item).toHaveLength(0);
    });

    it('should include script conversion warnings as comments', async () => {
      const content = `meta {
  name: Test Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}

script:pre-request {
  bru.customFunction("unmappable");
}`;

      const brunoRequest = parseBrunoFile(content);
      const collection = buildPostmanCollection('Test Collection', [
        { name: 'Test', request: brunoRequest },
      ]);

      const item = collection.item[0];
      const preRequestEvent = item.event?.find((e: any) => e.listen === 'prerequest');
      expect(preRequestEvent?.script?.exec?.join('\n')).toContain('// WARNING');
    });

    it('should set collection schema correctly', () => {
      const collection = buildPostmanCollection('Test', []);

      expect(collection.info.schema).toBe(
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      );
    });
  });
});
