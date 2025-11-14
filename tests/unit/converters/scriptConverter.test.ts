import { describe, it, expect } from '@jest/globals';
import {
  convertPreRequestScript,
  convertTestScript,
} from '../../../src/converters/scriptConverter.js';

describe('scriptConverter', () => {
  describe('convertPreRequestScript', () => {
    it('should convert bru.setVar to pm.environment.set', () => {
      const brunoScript = 'bru.setVar("timestamp", Date.now());';
      const result = convertPreRequestScript(brunoScript);

      expect(result.script).toContain('pm.environment.set("timestamp", Date.now());');
      expect(result.warnings).toHaveLength(0);
    });

    it('should convert bru.getVar to pm.environment.get', () => {
      const brunoScript = 'const token = bru.getVar("token");';
      const result = convertPreRequestScript(brunoScript);

      expect(result.script).toContain('const token = pm.environment.get("token");');
      expect(result.warnings).toHaveLength(0);
    });

    it('should convert bru.setEnvVar to pm.environment.set', () => {
      const brunoScript = 'bru.setEnvVar("apiKey", "value123");';
      const result = convertPreRequestScript(brunoScript);

      expect(result.script).toContain('pm.environment.set("apiKey", "value123");');
    });

    it('should convert bru.getEnvVar to pm.environment.get', () => {
      const brunoScript = 'const key = bru.getEnvVar("apiKey");';
      const result = convertPreRequestScript(brunoScript);

      expect(result.script).toContain('const key = pm.environment.get("apiKey");');
    });

    it('should handle multiline scripts', () => {
      const brunoScript = `
bru.setVar("timestamp", Date.now());
const token = bru.getVar("authToken");
console.log("Token:", token);
`;
      const result = convertPreRequestScript(brunoScript);

      const scriptContent = result.script.join('\n');
      expect(scriptContent).toContain('pm.environment.set');
      expect(scriptContent).toContain('pm.environment.get');
      expect(scriptContent).toContain('console.log');
    });

    it('should add warning for unmappable Bruno-specific code', () => {
      const brunoScript = 'bru.customFunction("test");';
      const result = convertPreRequestScript(brunoScript);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('partial conversion');
      expect(result.script.join('\n')).toContain('// WARNING: partial conversion - review manually');
    });

    it('should preserve standard JavaScript code', () => {
      const brunoScript = `
const now = Date.now();
const random = Math.random();
console.log("Test");
`;
      const result = convertPreRequestScript(brunoScript);

      const scriptContent = result.script.join('\n');
      expect(scriptContent).toContain('const now = Date.now()');
      expect(scriptContent).toContain('Math.random()');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('convertTestScript', () => {
    it('should preserve test() function calls', () => {
      const brunoScript = `
test("Status is 200", function() {
  expect(res.status).to.equal(200);
});
`;
      const result = convertTestScript(brunoScript);

      expect(result.script.join('\n')).toContain('test("Status is 200"');
      expect(result.script.join('\n')).toContain('expect(pm.response.code).to.equal(200)');
    });

    it('should convert res to pm.response equivalent', () => {
      const brunoScript = `
test("Check response", function() {
  expect(res.status).to.equal(200);
  expect(res.body).to.have.property("data");
});
`;
      const result = convertTestScript(brunoScript);

      const scriptContent = result.script.join('\n');
      expect(scriptContent).toContain('pm.response.code');
      expect(scriptContent).toContain('pm.response.json()');
    });

    it('should convert bru.setVar in tests to pm.environment.set', () => {
      const brunoScript = `
test("Save user ID", function() {
  bru.setVar("userId", res.body.id);
});
`;
      const result = convertTestScript(brunoScript);

      expect(result.script.join('\n')).toContain('pm.environment.set');
    });

    it('should handle expect assertions', () => {
      const brunoScript = `
test("Response validation", function() {
  expect(res.body).to.have.property("name");
  expect(res.headers["content-type"]).to.contain("json");
});
`;
      const result = convertTestScript(brunoScript);

      const scriptContent = result.script.join('\n');
      expect(scriptContent).toContain('expect');
      expect(scriptContent).toContain('to.have.property');
    });

    it('should add warnings for complex unmappable test code', () => {
      const brunoScript = 'bru.complexTestFunction();';
      const result = convertTestScript(brunoScript);

      expect(result.warnings).toHaveLength(1);
      expect(result.script.join('\n')).toContain('// WARNING');
    });
  });
});
