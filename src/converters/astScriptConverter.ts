/**
 * AST-based script converter for robust Bruno to Postman script transformation
 *
 * This converter uses Babel's parser and transformer to convert Bruno scripts
 * to Postman scripts with high fidelity, handling complex JavaScript constructs
 * like loops, closures, template literals, and destructuring.
 *
 * Usage: Opt-in via --experimental-ast flag. Falls back to regex converter on errors.
 *
 * Conversion mappings:
 * - bru.setVar() → pm.environment.set()
 * - bru.getVar() → pm.environment.get()
 * - bru.setEnvVar() → pm.environment.set()
 * - bru.getEnvVar() → pm.environment.get()
 * - res → pm.response (in test scripts)
 * - res.status → pm.response.code
 * - res.body → pm.response.json()
 * - res.getBody() → pm.response.json()
 * - res.headers → pm.response.headers
 * - res.responseTime → pm.response.responseTime
 * - test() → pm.test() (Bruno test function)
 * - expect() → pm.expect() (Chai assertions)
 */

import { parse } from '@babel/parser';
import traverseModule, { NodePath } from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

// Handle default exports for ESM compatibility
const traverse = (traverseModule as { default?: typeof traverseModule } & typeof traverseModule).default || traverseModule;
const generate = (generateModule as { default?: typeof generateModule } & typeof generateModule).default || generateModule;

interface ASTConversionResult {
  script: string;
  warnings: string[];
  success: boolean;
  errors?: string[];
}

/**
 * API mapping configuration for AST transformations
 */
const API_MAPPINGS = {
  // Bruno variable API → Postman environment API
  'bru.setVar': 'pm.environment.set',
  'bru.getVar': 'pm.environment.get',
  'bru.setEnvVar': 'pm.environment.set',
  'bru.getEnvVar': 'pm.environment.get',

  // Bruno response object → Postman response object
  'res.status': 'pm.response.code',
  'res.body': 'pm.response.json()',
  'res.headers': 'pm.response.headers',
  'res.responseTime': 'pm.response.responseTime',
  'res.getBody': 'pm.response.json',

  // Bruno test/assertion API → Postman test API
  'test': 'pm.test',
  'expect': 'pm.expect',
} as const;

/**
 * Convert Bruno pre-request script to Postman using AST parsing
 */
export function convertPreRequestScriptAST(brunoScript: string): ASTConversionResult {
  return convertScriptAST(brunoScript, 'prerequest');
}

/**
 * Convert Bruno test script to Postman using AST parsing
 */
export function convertTestScriptAST(brunoScript: string): ASTConversionResult {
  return convertScriptAST(brunoScript, 'test');
}

/**
 * Core AST-based conversion function
 */
function convertScriptAST(
  brunoScript: string,
  scriptType: 'prerequest' | 'test'
): ASTConversionResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Parse the script into an AST
    const ast = parse(brunoScript, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
      ],
    });

    // Track if we found any unmappable Bruno APIs
    let hasUnmappableCode = false;

    // Track responseBody rename warning
    let renamedResponseBody = false;

    // Traverse and transform the AST
    traverse(ast, {
      // Rename 'responseBody' variables in test scripts to avoid Postman sandbox conflict
      VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
        if (
          scriptType === 'test' &&
          t.isIdentifier(path.node.id) &&
          path.node.id.name === 'responseBody'
        ) {
          // Rename to avoid conflict with Postman's built-in responseBody
          const newName = 'parsedResponseBody';

          // Get the scope to rename all references
          const binding = path.scope.getBinding('responseBody');
          if (binding) {
            binding.scope.rename('responseBody', newName);
            renamedResponseBody = true;
          }
        }
      },


      // Transform call expressions for method calls like bru.setVar(), test(), expect()
      CallExpression(path: NodePath<t.CallExpression>) {
        const node = path.node;

        // Handle bru.method() calls
        if (
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object) &&
          node.callee.object.name === 'bru' &&
          t.isIdentifier(node.callee.property)
        ) {
          const bruMethod = `bru.${node.callee.property.name}`;
          const postmanMethod = API_MAPPINGS[bruMethod as keyof typeof API_MAPPINGS];

          if (postmanMethod) {
            // Replace bru.method() with pm.environment.method()
            const parts = postmanMethod.split('.');
            if (parts.length === 3) {
              // pm.environment.set
              node.callee = t.memberExpression(
                t.memberExpression(t.identifier(parts[0]), t.identifier(parts[1])),
                t.identifier(parts[2])
              );
            } else if (parts.length === 2) {
              // pm.test
              node.callee = t.memberExpression(t.identifier(parts[0]), t.identifier(parts[1]));
            }
          } else {
            hasUnmappableCode = true;
            warnings.push(`Unmappable Bruno API: ${bruMethod}`);
          }
        }

        // Handle test() → pm.test()
        if (t.isIdentifier(node.callee) && node.callee.name === 'test') {
          node.callee = t.memberExpression(t.identifier('pm'), t.identifier('test'));
        }

        // Handle expect() → pm.expect()
        if (t.isIdentifier(node.callee) && node.callee.name === 'expect') {
          node.callee = t.memberExpression(t.identifier('pm'), t.identifier('expect'));
        }
      },

      // Transform member expressions like res.status, res.body
      MemberExpression(path: NodePath<t.MemberExpression>) {
        const node = path.node;

        // Handle res.* response object in test scripts
        if (
          scriptType === 'test' &&
          t.isIdentifier(node.object) &&
          node.object.name === 'res' &&
          t.isIdentifier(node.property)
        ) {
          const resProperty = `res.${node.property.name}`;
          const mapping = API_MAPPINGS[resProperty as keyof typeof API_MAPPINGS];

          if (mapping) {
            if (mapping.includes('(')) {
              // Method call like pm.response.json()
              const methodName = mapping.replace('()', '');
              const [pmObj, pmProp, pmMethod] = methodName.split('.');

              // Replace res.property with pm.response.method()
              node.object = t.memberExpression(
                t.identifier(pmObj),
                t.identifier(pmProp)
              );
              node.property = t.identifier(pmMethod);

              // Wrap in call expression if not already being called
              // (i.e., if parent is not a CallExpression OR if we're not the callee)
              const shouldWrap = !t.isCallExpression(path.parent) ||
                                 (t.isCallExpression(path.parent) && path.parent.callee !== node);
              if (shouldWrap) {
                path.replaceWith(t.callExpression(node, []));
              }
            } else {
              // Property access like pm.response.code
              const [pmObj, pmProp, pmSubProp] = mapping.split('.');
              node.object = t.memberExpression(
                t.identifier(pmObj),
                t.identifier(pmProp)
              );
              if (pmSubProp) {
                node.property = t.identifier(pmSubProp);
              }
            }
          } else {
            hasUnmappableCode = true;
            warnings.push(`Unmappable Bruno response property: ${resProperty}`);
          }
        }

        // Handle res.headers["key"] → pm.response.headers.get("key")
        // Also handle pm.response.headers["key"] → pm.response.headers.get("key") (after initial conversion)
        if (
          scriptType === 'test' &&
          node.computed && // Bracket notation
          t.isMemberExpression(node.object) &&
          !t.isPrivateName(node.property) // Ensure it's not a private name
        ) {
          // Check for res.headers["key"]
          const isResHeaders =
            t.isIdentifier(node.object.object) &&
            node.object.object.name === 'res' &&
            t.isIdentifier(node.object.property) &&
            node.object.property.name === 'headers';

          // Check for pm.response.headers["key"]
          // Structure: pm.response.headers['key'] is:
          // MemberExpression(MemberExpression(MemberExpression(pm, response), headers), 'key')
          let isPmResponseHeaders = false;
          if (t.isMemberExpression(node.object.object)) {
            const pmResponseNode = node.object.object;
            // Check if this is pm.response
            if (
              t.isMemberExpression(pmResponseNode.object) &&
              t.isIdentifier(pmResponseNode.object.object) &&
              pmResponseNode.object.object.name === 'pm' &&
              t.isIdentifier(pmResponseNode.object.property) &&
              pmResponseNode.object.property.name === 'response' &&
              t.isIdentifier(pmResponseNode.property) &&
              pmResponseNode.property.name === 'headers' &&
              t.isIdentifier(node.object.property) &&
              node.object.property.name === 'headers'
            ) {
              isPmResponseHeaders = true;
            }
          }

          if (isResHeaders || isPmResponseHeaders) {
            // Transform to pm.response.headers.get("key")
            const pmResponseHeaders = t.memberExpression(
              t.memberExpression(
                t.identifier('pm'),
                t.identifier('response')
              ),
              t.identifier('headers')
            );

            const getMethod = t.memberExpression(
              pmResponseHeaders,
              t.identifier('get')
            );

            // Replace with pm.response.headers.get(headerName)
            path.replaceWith(t.callExpression(getMethod, [node.property]));
          }
        }

        // Handle res.getBody() method call
        if (
          scriptType === 'test' &&
          t.isIdentifier(node.object) &&
          node.object.name === 'res' &&
          t.isIdentifier(node.property) &&
          node.property.name === 'getBody' &&
          t.isCallExpression(path.parent)
        ) {
          // Replace res.getBody() with pm.response.json()
          node.object = t.memberExpression(
            t.identifier('pm'),
            t.identifier('response')
          );
          node.property = t.identifier('json');
        }
      },
    });

    // Generate the transformed code
    const result = generate(ast, {
      comments: true,
      compact: false,
      retainLines: false,
    });

    let finalScript = result.code;

    // Add warning comment if there was unmappable code
    if (hasUnmappableCode) {
      finalScript = '// WARNING: partial conversion - review manually\n' + finalScript;
      warnings.push('Script contains partial conversion - manual review required');
    }

    // Add info about responseBody rename
    if (renamedResponseBody) {
      warnings.push('Variable "responseBody" renamed to "parsedResponseBody" to avoid Postman sandbox conflict');
    }

    return {
      script: finalScript,
      warnings,
      success: true,
    };
  } catch (error) {
    // AST parsing/transformation failed - return error
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`AST conversion failed: ${errorMessage}`);

    // Log detailed error for debugging
    if (error instanceof Error && error.stack) {
      console.error('AST conversion error details:', error.stack);
    }

    return {
      script: brunoScript, // Return original script unchanged
      warnings: ['AST conversion failed - falling back to regex converter'],
      success: false,
      errors,
    };
  }
}

/**
 * Utility to detect if a script contains complex constructs that benefit from AST
 */
export function shouldUseAST(script: string): boolean {
  // Patterns that indicate complex scripts
  const complexPatterns = [
    /\bfor\s*\(/,           // for loops
    /\bwhile\s*\(/,         // while loops
    /=>\s*{/,               // arrow functions with blocks
    /\bfunction\s/,         // function declarations
    /\bconst\s+{.*}/,       // destructuring
    /`.*\${.*}.*`/,         // template literals
    /\bclass\s+/,           // class declarations
    /\basync\s+/,           // async functions
    /\bawait\s+/,           // await expressions
    /\.\.\./,               // spread operator
  ];

  return complexPatterns.some(pattern => pattern.test(script));
}
