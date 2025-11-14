import { describe, it, expect } from '@jest/globals';
import {
  convertPreRequestScriptAST,
  convertTestScriptAST,
  shouldUseAST,
} from '../../../src/converters/astScriptConverter.js';

describe('astScriptConverter', () => {
  describe('shouldUseAST', () => {
    it('should detect for loops', () => {
      expect(shouldUseAST('for (let i = 0; i < 10; i++) {}')).toBe(true);
    });

    it('should detect while loops', () => {
      expect(shouldUseAST('while (condition) {}')).toBe(true);
    });

    it('should detect arrow functions with blocks', () => {
      expect(shouldUseAST('const fn = () => { return true; }')).toBe(true);
    });

    it('should detect function declarations', () => {
      expect(shouldUseAST('function test() {}')).toBe(true);
    });

    it('should detect destructuring', () => {
      expect(shouldUseAST('const { name, age } = obj;')).toBe(true);
    });

    it('should detect template literals', () => {
      expect(shouldUseAST('const msg = `Hello ${name}`;')).toBe(true);
    });

    it('should detect class declarations', () => {
      expect(shouldUseAST('class User {}')).toBe(true);
    });

    it('should detect async functions', () => {
      expect(shouldUseAST('async function fetchData() {}')).toBe(true);
    });

    it('should detect await expressions', () => {
      expect(shouldUseAST('await fetch(url);')).toBe(true);
    });

    it('should detect spread operators', () => {
      expect(shouldUseAST('const arr = [...items];')).toBe(true);
    });

    it('should return false for simple scripts', () => {
      expect(shouldUseAST('bru.setVar("key", "value");')).toBe(false);
    });
  });

  describe('convertPreRequestScriptAST', () => {
    it('should convert bru.setVar to pm.environment.set', () => {
      const brunoScript = 'bru.setVar("timestamp", Date.now());';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.set("timestamp", Date.now())');
      expect(result.warnings).toHaveLength(0);
    });

    it('should convert bru.getVar to pm.environment.get', () => {
      const brunoScript = 'const token = bru.getVar("token");';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const token = pm.environment.get("token")');
      expect(result.warnings).toHaveLength(0);
    });

    it('should convert bru.setEnvVar to pm.environment.set', () => {
      const brunoScript = 'bru.setEnvVar("apiKey", "value123");';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.set("apiKey", "value123")');
    });

    it('should convert bru.getEnvVar to pm.environment.get', () => {
      const brunoScript = 'const key = bru.getEnvVar("apiKey");';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const key = pm.environment.get("apiKey")');
    });

    it('should handle complex scripts with for loops', () => {
      const brunoScript = `
for (let i = 0; i < 10; i++) {
  bru.setVar(\`key\${i}\`, i * 2);
}
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('for (let i = 0; i < 10; i++)');
      expect(result.script).toContain('pm.environment.set');
    });

    it('should handle arrow functions with closures', () => {
      const brunoScript = `
const timestamps = [1, 2, 3].map(n => {
  const ts = Date.now() + n;
  bru.setVar(\`ts\${n}\`, ts);
  return ts;
});
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.set');
      expect(result.script).toContain('.map(n =>');
    });

    it('should handle template literals', () => {
      const brunoScript = `
const name = "Alice";
const message = \`Hello \${name}\`;
bru.setVar("greeting", message);
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('`Hello ${name}`');
      expect(result.script).toContain('pm.environment.set("greeting", message)');
    });

    it('should handle destructuring', () => {
      const brunoScript = `
const config = { apiKey: "123", secret: "abc" };
const { apiKey, secret } = config;
bru.setVar("apiKey", apiKey);
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      // Babel may format with newlines, so check for key parts
      expect(result.script).toMatch(/apiKey.*secret.*=.*config/s);
      expect(result.script).toContain('pm.environment.set("apiKey", apiKey)');
    });

    it('should handle async/await', () => {
      const brunoScript = `
async function fetchToken() {
  const response = await fetch("https://api.example.com/token");
  const data = await response.json();
  bru.setVar("token", data.token);
}
fetchToken();
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('async function fetchToken()');
      expect(result.script).toContain('await fetch');
      expect(result.script).toContain('pm.environment.set("token", data.token)');
    });

    it('should handle spread operators', () => {
      const brunoScript = `
const headers = { ...defaultHeaders, "Authorization": token };
bru.setVar("headers", JSON.stringify(headers));
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('...defaultHeaders');
      expect(result.script).toContain('pm.environment.set("headers"');
    });

    it('should handle nested bru calls', () => {
      const brunoScript = `
const oldValue = bru.getVar("counter") || "0";
const newValue = parseInt(oldValue) + 1;
bru.setVar("counter", newValue.toString());
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.get("counter")');
      expect(result.script).toContain('pm.environment.set("counter"');
    });

    it('should preserve comments', () => {
      const brunoScript = `
// Set timestamp for request
bru.setVar("timestamp", Date.now());
/* Multi-line comment
   about the token */
const token = bru.getVar("token");
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('// Set timestamp for request');
      expect(result.script).toContain('/* Multi-line comment');
    });

    it('should add warning for unmappable Bruno APIs', () => {
      const brunoScript = 'bru.customFunction("test");';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Unmappable Bruno API'))).toBe(true);
      expect(result.script).toContain('// WARNING: partial conversion - review manually');
    });

    it('should handle invalid syntax gracefully', () => {
      const brunoScript = 'const invalid = {{{';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('AST conversion failed - falling back to regex converter');
    });
  });

  describe('convertTestScriptAST', () => {
    it('should convert test() to pm.test()', () => {
      const brunoScript = `
test("Status is 200", function() {
  expect(res.status).to.equal(200);
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.test("Status is 200"');
      expect(result.script).toContain('pm.expect(pm.response.code)');
    });

    it('should convert expect() to pm.expect()', () => {
      const brunoScript = 'expect(res.body).to.have.property("id");';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.expect(pm.response.json())');
    });

    it('should convert res.status to pm.response.code', () => {
      const brunoScript = 'const statusCode = res.status;';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const statusCode = pm.response.code');
    });

    it('should convert res.body to pm.response.json()', () => {
      const brunoScript = 'const data = res.body;';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const data = pm.response.json()');
    });

    it('should convert res.getBody() to pm.response.json()', () => {
      const brunoScript = 'const data = res.getBody();';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const data = pm.response.json()');
    });

    it('should convert res.headers to pm.response.headers', () => {
      const brunoScript = 'const headers = res.headers;';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const headers = pm.response.headers');
    });

    it('should convert res.responseTime to pm.response.responseTime', () => {
      const brunoScript = 'const time = res.responseTime;';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('const time = pm.response.responseTime');
    });

    it('should handle complex test with loops and conditions', () => {
      const brunoScript = `
test("Validate array items", function() {
  const items = res.body.items;
  for (let i = 0; i < items.length; i++) {
    expect(items[i]).to.have.property("id");
    if (items[i].status === "active") {
      bru.setVar(\`activeItem\${i}\`, items[i].id);
    }
  }
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.test("Validate array items"');
      expect(result.script).toContain('pm.response.json()');
      expect(result.script).toContain('pm.expect(items[i])');
      expect(result.script).toContain('pm.environment.set');
      expect(result.script).toContain('for (let i = 0; i < items.length; i++)');
    });

    it('should handle arrow function tests', () => {
      const brunoScript = `
test("Check status", () => {
  expect(res.status).to.equal(200);
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.test("Check status", () =>');
      expect(result.script).toContain('pm.expect(pm.response.code)');
    });

    it('should handle nested expect calls', () => {
      const brunoScript = `
test("Complex validation", function() {
  const body = res.getBody();
  expect(body.user).to.have.property("email");
  expect(body.user.email).to.match(/^[^@]+@[^@]+$/);
  expect(body.items).to.be.an("array");
  expect(body.items).to.have.lengthOf(5);
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.response.json()');
      expect(result.script).toContain('pm.expect(body.user)');
      expect(result.script).toContain('pm.expect(body.user.email)');
      expect(result.script).toContain('pm.expect(body.items)');
    });

    it('should handle destructuring in tests', () => {
      const brunoScript = `
test("Destructured validation", function() {
  const { id, name, status } = res.body;
  expect(id).to.be.a("number");
  expect(name).to.equal("Test");
  expect(status).to.equal("active");
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      // Babel may format with newlines, check for key parts
      expect(result.script).toMatch(/id.*name.*status.*=.*pm\.response\.json\(\)/s);
      expect(result.script).toContain('pm.expect(id)');
    });

    it('should handle template literals in test names', () => {
      const brunoScript = `
const endpoint = "/users";
test(\`Response from \${endpoint} is valid\`, function() {
  expect(res.status).to.equal(200);
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.test(`Response from ${endpoint} is valid`');
    });

    it('should convert bru calls within tests', () => {
      const brunoScript = `
test("Save response data", function() {
  const userId = res.body.id;
  bru.setVar("userId", userId);

  const token = bru.getVar("authToken");
  expect(token).to.not.be.undefined;
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.set("userId", userId)');
      expect(result.script).toContain('pm.environment.get("authToken")');
    });

    it('should add warning for unmappable response properties', () => {
      const brunoScript = 'const custom = res.customProperty;';
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Unmappable Bruno response property'))).toBe(true);
    });

    it('should handle class declarations in tests', () => {
      const brunoScript = `
class DataValidator {
  constructor(data) {
    this.data = data;
  }

  validate() {
    expect(this.data).to.have.property("id");
    return this.data.id;
  }
}

test("Validate with class", function() {
  const validator = new DataValidator(res.body);
  const id = validator.validate();
  expect(id).to.be.a("number");
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('class DataValidator');
      expect(result.script).toContain('pm.response.json()');
      expect(result.script).toContain('pm.expect');
    });

    it('should preserve line structure for readable output', () => {
      const brunoScript = `
test("Multi-line test", function() {
  const data = res.body;

  expect(data.id).to.be.a("number");
  expect(data.name).to.be.a("string");

  bru.setVar("userId", data.id);
});
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      // Check that the structure is maintained with separate statements
      const lines = result.script.split('\n');
      expect(lines.length).toBeGreaterThan(5); // Multiple lines maintained
    });
  });

  describe('edge cases', () => {
    it('should handle empty scripts', () => {
      const result = convertPreRequestScriptAST('');
      expect(result.success).toBe(true);
      expect(result.script).toBe('');
    });

    it('should handle scripts with only comments', () => {
      const brunoScript = `
// Just a comment
/* Another comment */
`;
      const result = convertPreRequestScriptAST(brunoScript);
      expect(result.success).toBe(true);
      expect(result.script).toContain('// Just a comment');
    });

    it('should handle scripts with unicode characters', () => {
      const brunoScript = 'bru.setVar("emoji", "🚀");';
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('pm.environment.set("emoji", "🚀")');
    });

    it('should handle scripts with regex literals', () => {
      const brunoScript = `
const pattern = /\\d{3}-\\d{4}/;
const phone = bru.getVar("phone");
test("Phone format", () => expect(pattern.test(phone)).to.be.true);
`;
      const result = convertTestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('/\\d{3}-\\d{4}/');
      expect(result.script).toContain('pm.environment.get("phone")');
    });

    it('should handle mixed Bruno and standard JS APIs', () => {
      const brunoScript = `
const timestamp = Date.now();
const random = Math.random();
const uuid = crypto.randomUUID();

bru.setVar("timestamp", timestamp);
bru.setVar("random", random);
bru.setVar("uuid", uuid);
`;
      const result = convertPreRequestScriptAST(brunoScript);

      expect(result.success).toBe(true);
      expect(result.script).toContain('Date.now()');
      expect(result.script).toContain('Math.random()');
      expect(result.script).toContain('crypto.randomUUID()');
      expect(result.script).toContain('pm.environment.set');
    });
  });
});
