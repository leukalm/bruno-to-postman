import { BrunoRequest } from '../types/bruno.types.js';
import { PostmanCollection, PostmanItem, PostmanEvent } from '../types/postman.types.js';
import { convertBrunoToPostmanRequest } from '../converters/requestConverter.js';
import { convertPreRequestScript, convertTestScript } from '../converters/scriptConverter.js';
import { convertPreRequestScriptAST, convertTestScriptAST } from '../converters/astScriptConverter.js';
import { FileTreeNode } from '../types/brunoCollection.types.js';

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
 * @param items - Array of collection items OR FileTreeNode for hierarchical conversion
 * @param useAST - Use AST-based script conversion (experimental)
 * @returns Complete Postman collection
 */
export function buildPostmanCollection(
  name: string,
  items: CollectionItem[] | FileTreeNode,
  useAST: boolean = false
): PostmanCollection {
  const collection: PostmanCollection = {
    info: {
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [],
  };

  // Check if items is a FileTreeNode (hierarchical) or flat array
  if (Array.isArray(items)) {
    // Legacy flat array conversion
    for (const { name: itemName, request: brunoRequest } of items) {
      const postmanItem = buildPostmanItem(itemName, brunoRequest, useAST);
      collection.item.push(postmanItem);
    }
  } else {
    // Hierarchical FileTreeNode conversion
    collection.item = buildPostmanItems(items, useAST);
  }

  return collection;
}

/**
 * Recursively build Postman items from FileTreeNode
 * @param node - FileTreeNode (can be file or directory)
 * @param useAST - Use AST-based script conversion
 * @returns Array of PostmanItem (can include item groups for folders)
 */
function buildPostmanItems(node: FileTreeNode, useAST: boolean): PostmanItem[] {
  if (node.type === 'directory') {
    // For directory nodes, return all children
    const items: PostmanItem[] = [];
    for (const child of node.children) {
      if (child.type === 'file' && child.brunoRequest) {
        // File: convert to request item
        const postmanItem = buildPostmanItem(child.name.replace('.bru', ''), child.brunoRequest, useAST);
        items.push(postmanItem);
      } else if (child.type === 'directory') {
        // Directory: convert to item-group (folder)
        const folderItem: PostmanItem = {
          name: child.name,
          item: buildPostmanItems(child, useAST),
        };
        items.push(folderItem);
      }
    }
    return items;
  } else {
    // Single file node
    if (node.brunoRequest) {
      return [buildPostmanItem(node.name.replace('.bru', ''), node.brunoRequest, useAST)];
    }
    return [];
  }
}

/**
 * Build a single Postman item from a Bruno request
 * @param itemName - Name of the item
 * @param brunoRequest - Bruno request to convert
 * @param useAST - Use AST-based script conversion
 * @returns PostmanItem
 */
function buildPostmanItem(
  itemName: string,
  brunoRequest: BrunoRequest,
  useAST: boolean
): PostmanItem {
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

  return postmanItem;
}
