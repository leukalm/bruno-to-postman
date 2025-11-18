/**
 * Bruno Collection Metadata
 * Represents the bruno.json file structure
 */
export interface BrunoCollectionMetadata {
  version: '1';
  name: string;
  type: 'collection';
}

/**
 * File Tree Node
 * Hierarchical representation of directory structure
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  brunoRequest?: import('./bruno.types.js').BrunoRequest;
  children: FileTreeNode[];
}

/**
 * Batch Conversion Report
 * Summary of batch conversion results
 */
export interface BatchConversionReport {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors: ConversionError[];
  warnings: string[];
  outputPath?: string;
  successRate: number;
}

/**
 * Conversion Error
 * Detailed error information for failed conversions
 */
export interface ConversionError {
  filePath: string;
  message: string;
  type: 'parse' | 'validation' | 'conversion' | 'filesystem';
  line?: number;
  phase: 'read' | 'parse' | 'validate' | 'convert' | 'write';
  suggestion?: string;
  isRecoverable: boolean;
}
