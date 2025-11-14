import { BrunoRequest } from '../types/bruno.types.js';
import { PostmanCollection, PostmanItem, PostmanEvent } from '../types/postman.types.js';
import { convertBrunoToPostmanRequest } from '../converters/requestConverter.js';
import { convertPreRequestScript, convertTestScript } from '../converters/scriptConverter.js';
import { convertPreRequestScriptAST, convertTestScriptAST } from '../converters/astScriptConverter.js';

/**
 * Input structure for building a collection
 */
export interface CollectionItem {
  name: string;
  request: BrunoRequest;
}

/**
 * Build a Postman collection from Bruno requests
 * @param name - The name of the collection
 * @param items - Array of collection items with name and request
 * @param useAST - Use AST-based script conversion (experimental)
 * @returns Complete Postman collection
 */
export function buildPostmanCollection(
  name: string,
  items: CollectionItem[],
  useAST: boolean = false
): PostmanCollection {
  const collection: PostmanCollection = {
    info: {
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [],
  };

  // Convert each Bruno request to a Postman item
  for (const { name: itemName, request: brunoRequest } of items) {
    const postmanItem: PostmanItem = {
      name: itemName,
      request: convertBrunoToPostmanRequest(brunoRequest),
    };

    // Add pre-request script if present
    if (brunoRequest.preRequestScript) {
      let preRequestScript: string[];

      if (useAST) {
        // Try AST conversion first
        const astResult = convertPreRequestScriptAST(brunoRequest.preRequestScript);

        if (astResult.success) {
          preRequestScript = astResult.script.split('\n');
        } else {
          // Fallback to regex converter
          console.warn('AST conversion failed for pre-request script, falling back to regex converter');
          const regexResult = convertPreRequestScript(brunoRequest.preRequestScript);
          preRequestScript = regexResult.script;
        }
      } else {
        // Use regex converter (default)
        const regexResult = convertPreRequestScript(brunoRequest.preRequestScript);
        preRequestScript = regexResult.script;
      }

      if (!postmanItem.event) {
        postmanItem.event = [];
      }

      const preRequestEvent: PostmanEvent = {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: preRequestScript,
        },
      };

      postmanItem.event.push(preRequestEvent);
    }

    // Add test script if present
    if (brunoRequest.testScript) {
      let testScript: string[];

      if (useAST) {
        // Try AST conversion first
        const astResult = convertTestScriptAST(brunoRequest.testScript);

        if (astResult.success) {
          testScript = astResult.script.split('\n');
        } else {
          // Fallback to regex converter
          console.warn('AST conversion failed for test script, falling back to regex converter');
          const regexResult = convertTestScript(brunoRequest.testScript);
          testScript = regexResult.script;
        }
      } else {
        // Use regex converter (default)
        const regexResult = convertTestScript(brunoRequest.testScript);
        testScript = regexResult.script;
      }

      if (!postmanItem.event) {
        postmanItem.event = [];
      }

      const testEvent: PostmanEvent = {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: testScript,
        },
      };

      postmanItem.event.push(testEvent);
    }

    collection.item.push(postmanItem);
  }

  return collection;
}
