/**
 * End-to-end integration tests for User Story 1: Single File Conversion
 *
 * Acceptance Criteria:
 * AC1: User can convert a single .bru file to Postman collection JSON
 * AC2: Converted collection validates against Postman Collection v2.1 schema
 * AC3: Variables in {{}} format are preserved
 * AC4: Script conversion warnings are included
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, readFile } from '../../src/services/fileService.js';
import { parseBrunoFile } from '../../src/parsers/brunoParser.js';
import { validateBrunoRequest } from '../../src/validators/brunoValidator.js';
import { buildPostmanCollection } from '../../src/builders/collectionBuilder.js';
import { validatePostmanCollection } from '../../src/validators/postmanValidator.js';

describe('User Story 1: Single File Conversion (E2E)', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'bruno-e2e-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('AC1: User can convert a single .bru file to Postman collection JSON', async () => {
    // Given: A Bruno file with a simple GET request
    const brunoContent = `meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}`;

    const inputPath = join(testDir, 'get-users.bru');
    await writeFile(inputPath, brunoContent);

    // When: User converts the file
    const content = await readFile(inputPath);
    const brunoRequest = parseBrunoFile(content);
    const collection = buildPostmanCollection('Get Users API', [
      { name: brunoRequest.meta.name, request: brunoRequest },
    ]);

    const outputPath = join(testDir, 'output.json');
    await writeFile(outputPath, JSON.stringify(collection, null, 2));

    // Then: A valid Postman collection JSON file is created
    const outputContent = await readFile(outputPath);
    const parsedCollection = JSON.parse(outputContent);

    expect(parsedCollection.info.name).toBe('Get Users API');
    expect(parsedCollection.item).toHaveLength(1);
    expect(parsedCollection.item[0].request.method).toBe('GET');
    expect(parsedCollection.item[0].request.url.raw).toBe('https://api.example.com/users');
  });

  it('AC2: Converted collection validates against Postman Collection v2.1 schema', async () => {
    // Given: A Bruno file with full request details
    const brunoContent = `meta {
  name: Create User
  type: http
  seq: 1
}

post {
  url: https://api.example.com/users
}

headers {
  Content-Type: application/json
  Authorization: Bearer {{token}}
}

body:json {
  {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}

auth:bearer {
  token: {{apiToken}}
}`;

    // When: File is converted through the pipeline
    const brunoRequest = parseBrunoFile(brunoContent);
    validateBrunoRequest(brunoRequest);

    const collection = buildPostmanCollection('User Management API', [
      { name: brunoRequest.meta.name, request: brunoRequest },
    ]);

    // Then: Collection validates successfully against Postman schema
    expect(() => validatePostmanCollection(collection)).not.toThrow();

    const validatedCollection = validatePostmanCollection(collection);
    expect(validatedCollection.info.schema).toBe(
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    );
    expect(validatedCollection.item[0].request?.method).toBe('POST');
    expect(validatedCollection.item[0].request?.body?.mode).toBe('raw');
    expect(validatedCollection.item[0].request?.auth?.type).toBe('bearer');
  });

  it('AC3: Variables in {{}} format are preserved throughout conversion', async () => {
    // Given: A Bruno file with variables in multiple locations
    const brunoContent = `meta {
  name: Get User Profile
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/users/{{userId}}/profile
}

params:query {
  include: {{includeFields}}
  exclude: {{excludeFields}}
}

headers {
  Authorization: Bearer {{authToken}}
  X-API-Key: {{apiKey}}
}`;

    // When: File is converted
    const brunoRequest = parseBrunoFile(brunoContent);
    const collection = buildPostmanCollection('User API', [
      { name: brunoRequest.meta.name, request: brunoRequest },
    ]);

    // Then: All variables are preserved in the Postman collection
    const item = collection.item[0];
    const url = item.request?.url;

    // Check URL variables
    if (typeof url === 'object') {
      expect(url.raw).toContain('{{baseUrl}}');
      expect(url.raw).toContain('{{userId}}');

      // Check query parameter variables
      const queryParams = url.query || [];
      const includeParam = queryParams.find((q: any) => q.key === 'include');
      const excludeParam = queryParams.find((q: any) => q.key === 'exclude');

      expect(includeParam?.value).toBe('{{includeFields}}');
      expect(excludeParam?.value).toBe('{{excludeFields}}');
    }

    // Check header variables
    const headers = item.request?.header || [];
    const authHeader = headers.find((h: any) => h.key === 'Authorization');
    const apiKeyHeader = headers.find((h: any) => h.key === 'X-API-Key');

    expect(authHeader?.value).toBe('Bearer {{authToken}}');
    expect(apiKeyHeader?.value).toBe('{{apiKey}}');
  });

  it('AC4: Script conversion warnings are included when unmappable code exists', async () => {
    // Given: A Bruno file with both mappable and unmappable scripts
    const brunoContent = `meta {
  name: Test Request
  type: http
  seq: 1
}

get {
  url: https://api.example.com/test
}

script:pre-request {
  bru.setVar("timestamp", Date.now());
  bru.customFunction("unmappable");
}

script:test {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  bru.anotherCustomFunction();
}`;

    // When: File is converted with script conversion
    const brunoRequest = parseBrunoFile(brunoContent);
    const collection = buildPostmanCollection('Test API', [
      { name: brunoRequest.meta.name, request: brunoRequest },
    ]);

    // Then: Warnings are included in the converted scripts
    const item = collection.item[0];
    const events = item.event || [];

    const preRequestEvent = events.find((e: any) => e.listen === 'prerequest');
    const preRequestScript = preRequestEvent?.script?.exec?.join('\n') || '';

    expect(preRequestScript).toContain('// WARNING: partial conversion');
    expect(preRequestScript).toContain('pm.environment.set'); // Converted code
    expect(preRequestScript).toContain('bru.customFunction'); // Unmappable code preserved

    const testEvent = events.find((e: any) => e.listen === 'test');
    const testScript = testEvent?.script?.exec?.join('\n') || '';

    expect(testScript).toContain('// WARNING: partial conversion');
    expect(testScript).toContain('pm.response.code'); // Converted code
    expect(testScript).toContain('bru.anotherCustomFunction'); // Unmappable code preserved
  });

  it('Complete E2E workflow: Parse -> Validate -> Build -> Validate -> Export', async () => {
    // Given: A comprehensive Bruno file
    const brunoContent = `meta {
  name: Complete Request
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/v1/resources
}

headers {
  Content-Type: application/json
  Accept: application/json
  Authorization: Bearer {{token}}
}

params:query {
  page: 1
  limit: 10
}

body:json {
  {
    "name": "Test Resource",
    "value": "{{resourceValue}}"
  }
}

auth:bearer {
  token: {{bearerToken}}
}

script:pre-request {
  bru.setVar("timestamp", Date.now());
  console.log("Request starting");
}

script:test {
  test("Response is successful", function() {
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("id");
  });

  bru.setVar("resourceId", res.body.id);
}`;

    // When: Complete conversion workflow is executed
    const outputPath = join(testDir, 'complete.postman_collection.json');

    // Step 1: Parse
    const brunoRequest = parseBrunoFile(brunoContent);
    expect(brunoRequest.method).toBe('POST');

    // Step 2: Validate Bruno
    expect(() => validateBrunoRequest(brunoRequest)).not.toThrow();

    // Step 3: Build Postman collection
    const collection = buildPostmanCollection('Complete API Test', [
      { name: brunoRequest.meta.name, request: brunoRequest },
    ]);
    expect(collection.item).toHaveLength(1);

    // Step 4: Validate Postman collection
    const validatedCollection = validatePostmanCollection(collection);
    expect(validatedCollection.info.schema).toBeDefined();

    // Step 5: Export to file
    await writeFile(outputPath, JSON.stringify(validatedCollection, null, 2));

    // Then: File is created and contains valid JSON
    const exportedContent = await readFile(outputPath);
    const parsedExport = JSON.parse(exportedContent);

    expect(parsedExport.info.name).toBe('Complete API Test');
    expect(parsedExport.item[0].name).toBe('Complete Request');
    expect(parsedExport.item[0].request.method).toBe('POST');
    expect(parsedExport.item[0].request.url.raw).toContain('{{baseUrl}}');
    expect(parsedExport.item[0].request.body.raw).toContain('{{resourceValue}}');
    expect(parsedExport.item[0].event).toHaveLength(2);
  });
});
