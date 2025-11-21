/**
 * Converts Bruno scripts to Postman scripts
 *
 * Bruno uses the `bru` object for script interactions, while Postman uses `pm`.
 * This converter performs best-effort conversion with warnings for unmappable code.
 *
 * Conversion mappings:
 * - bru.setVar() → pm.environment.set()
 * - bru.getVar() → pm.environment.get()
 * - bru.setEnvVar() → pm.environment.set()
 * - bru.getEnvVar() → pm.environment.get()
 * - res → pm.response (in test scripts)
 * - res.status → pm.response.code
 * - res.body → pm.response.json()
 * - res.headers → pm.response.headers
 * - res.responseTime → pm.response.responseTime
 * - test() → pm.test() (Bruno test function)
 * - expect() → pm.expect() (Chai assertions)
 */

interface ScriptConversionResult {
  script: string[];
  warnings: string[];
}

/**
 * API mapping table for Bruno to Postman conversions
 */
const API_MAPPINGS = {
  'bru.setVar': 'pm.environment.set',
  'bru.getVar': 'pm.environment.get',
  'bru.setEnvVar': 'pm.environment.set',
  'bru.getEnvVar': 'pm.environment.get',
} as const;

/**
 * Convert Bruno pre-request script to Postman pre-request script
 * @param brunoScript - The Bruno pre-request script
 * @returns Converted script lines and warnings
 */
export function convertPreRequestScript(brunoScript: string): ScriptConversionResult {
  const lines = brunoScript.split('\n');
  const convertedLines: string[] = [];
  const warnings: string[] = [];
  let hasUnmappableCode = false;

  for (const line of lines) {
    let convertedLine = line;
    let lineConverted = false;

    // Apply API mappings
    for (const [brunoApi, postmanApi] of Object.entries(API_MAPPINGS)) {
      if (convertedLine.includes(brunoApi)) {
        convertedLine = convertedLine.replace(new RegExp(brunoApi, 'g'), postmanApi);
        lineConverted = true;
      }
    }

    // Check for unmappable Bruno-specific code
    if (!lineConverted && line.includes('bru.') && !line.trim().startsWith('//')) {
      hasUnmappableCode = true;
    }

    convertedLines.push(convertedLine);
  }

  // Add warning if there's unmappable code
  if (hasUnmappableCode) {
    convertedLines.unshift('// WARNING: partial conversion - review manually');
    warnings.push('Script contains partial conversion - manual review required');
  }

  return {
    script: convertedLines,
    warnings,
  };
}

/**
 * Convert Bruno test script to Postman test script
 * @param brunoScript - The Bruno test script
 * @returns Converted script lines and warnings
 */
export function convertTestScript(brunoScript: string): ScriptConversionResult {
  const lines = brunoScript.split('\n');
  const convertedLines: string[] = [];
  const warnings: string[] = [];
  let hasUnmappableCode = false;

  for (const line of lines) {
    let convertedLine = line;
    let lineConverted = false;

    // Apply API mappings for bru.* functions
    for (const [brunoApi, postmanApi] of Object.entries(API_MAPPINGS)) {
      if (convertedLine.includes(brunoApi)) {
        convertedLine = convertedLine.replace(new RegExp(brunoApi, 'g'), postmanApi);
        lineConverted = true;
      }
    }

    // Convert res object to pm.response equivalents
    // res.status → pm.response.code
    if (convertedLine.includes('res.status')) {
      convertedLine = convertedLine.replace(/res\.status/g, 'pm.response.code');
      lineConverted = true;
    }

    // res.getBody() → pm.response.json()
    if (convertedLine.includes('res.getBody()')) {
      convertedLine = convertedLine.replace(/res\.getBody\(\)/g, 'pm.response.json()');
      lineConverted = true;
    }

    // res.body → pm.response.json()
    if (convertedLine.includes('res.body')) {
      convertedLine = convertedLine.replace(/res\.body/g, 'pm.response.json()');
      lineConverted = true;
    }

    // res.headers → pm.response.headers
    if (convertedLine.includes('res.headers')) {
      convertedLine = convertedLine.replace(/res\.headers/g, 'pm.response.headers');
      lineConverted = true;
    }

    // res.responseTime → pm.response.responseTime
    if (convertedLine.includes('res.responseTime')) {
      convertedLine = convertedLine.replace(/res\.responseTime/g, 'pm.response.responseTime');
      lineConverted = true;
    }

    // test() → pm.test() (Bruno test function to Postman)
    // Use word boundary to avoid replacing 'test' in other contexts
    if (convertedLine.match(/\btest\s*\(/)) {
      convertedLine = convertedLine.replace(/\btest\s*\(/g, 'pm.test(');
      lineConverted = true;
    }

    // expect() → pm.expect() (Bruno/Chai assertions to Postman)
    // Use word boundary to avoid replacing 'expect' in other contexts
    if (convertedLine.match(/\bexpect\s*\(/)) {
      convertedLine = convertedLine.replace(/\bexpect\s*\(/g, 'pm.expect(');
      lineConverted = true;
    }

    // Check for unmappable Bruno-specific code
    if (!lineConverted && line.includes('bru.') && !line.trim().startsWith('//')) {
      hasUnmappableCode = true;
    }

    convertedLines.push(convertedLine);
  }

  // Add warning if there's unmappable code
  if (hasUnmappableCode) {
    convertedLines.unshift('// WARNING: partial conversion - review manually');
    warnings.push('Script contains partial conversion - manual review required');
  }

  return {
    script: convertedLines,
    warnings,
  };
}
