import { relative, dirname, basename } from 'path';
import { FileTreeNode } from '../types/brunoCollection.types.js';

/**
 * Build a hierarchical file tree from a flat list of file paths
 * @param files - Array of absolute file paths
 * @param rootPath - The root directory path
 * @returns Root FileTreeNode with nested children
 */
export function buildFileTree(files: string[], rootPath: string): FileTreeNode {
  const root: FileTreeNode = {
    name: basename(rootPath),
    path: rootPath,
    type: 'directory',
    children: [],
  };

  // Sort files alphabetically for consistent ordering
  const sortedFiles = [...files].sort();

  for (const filePath of sortedFiles) {
    // Get relative path from root
    const relativePath = relative(rootPath, filePath);
    const parts = relativePath.split('/');

    // Navigate/create the tree structure
    let currentNode = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      // Check if this node already exists
      let childNode = currentNode.children.find((child) => child.name === part);

      if (!childNode) {
        // Create new node
        childNode = {
          name: part,
          path: isFile ? filePath : dirname(filePath.slice(0, filePath.indexOf(part) + part.length)),
          type: isFile ? 'file' : 'directory',
          children: [],
        };

        // Insert in sorted position (alphabetical)
        const insertIndex = currentNode.children.findIndex((child) => child.name > part);
        if (insertIndex === -1) {
          currentNode.children.push(childNode);
        } else {
          currentNode.children.splice(insertIndex, 0, childNode);
        }
      }

      currentNode = childNode;
    }
  }

  return root;
}
