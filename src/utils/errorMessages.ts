/**
 * English error message templates for the Bruno to Postman converter
 * All messages follow the format: State the problem → Explain why → Suggest action
 */

export const errorMessages = {
  INVALID_BRU_FILE: (file: string, reason: string): string =>
    `❌ File ${file} is not a valid Bruno file.\n` +
    `   Reason: ${reason}\n` +
    `   💡 Verify the file contains a meta section and an HTTP method.`,

  FILE_NOT_FOUND: (path: string): string =>
    `❌ File not found: ${path}\n` +
    `   💡 Check that the path is correct and you have read permissions.`,

  PARSE_ERROR: (file: string, line?: number, details?: string): string => {
    const lineInfo = line ? ` at line ${line}` : '';
    const detailsInfo = details ? `\n   Details: ${details}` : '';
    return (
      `❌ Failed to parse ${file}${lineInfo}.\n` +
      `   The file structure is invalid or corrupted.${detailsInfo}\n` +
      `   💡 Verify the file follows the Bruno format specification.`
    );
  },

  VALIDATION_ERROR: (file: string, errors: string[]): string =>
    `❌ Validation failed for ${file}.\n` +
    `   The following issues were found:\n` +
    errors.map((err) => `   - ${err}`).join('\n') +
    `\n   💡 Fix the validation errors and try again.`,

  WRITE_ERROR: (path: string, reason: string): string =>
    `❌ Failed to write file: ${path}\n` +
    `   Reason: ${reason}\n` +
    `   💡 Check that you have write permissions in the target directory.`,

  PERMISSION_DENIED: (path: string, operation: 'read' | 'write'): string =>
    `❌ Permission denied: Cannot ${operation} ${path}\n` +
    `   You don't have sufficient permissions to ${operation} this file.\n` +
    `   💡 Check file permissions or run with appropriate privileges.`,

  UNSUPPORTED_FEATURE: (feature: string, file?: string): string => {
    const fileInfo = file ? ` in ${file}` : '';
    return (
      `⚠️  Unsupported feature: ${feature}${fileInfo}\n` +
      `   This feature cannot be automatically converted to Postman format.\n` +
      `   💡 You will need to configure this manually in Postman after import.`
    );
  },

  DIRECTORY_NOT_FOUND: (path: string): string =>
    `❌ Directory not found: ${path}\n` +
    `   💡 Check that the directory exists and you have read permissions.`,

  NO_BRU_FILES_FOUND: (path: string): string =>
    `❌ No .bru files found in: ${path}\n` +
    `   The directory does not contain any Bruno request files.\n` +
    `   💡 Verify you're pointing to the correct directory.`,

  OUTPUT_EXISTS: (path: string): string =>
    `❌ File already exists: ${path}\n` +
    `   💡 Use --force to overwrite, or specify a different output path.`,

  INVALID_COLLECTION_NAME: (name: string): string =>
    `❌ Invalid collection name: ${name}\n` +
    `   Collection names cannot be empty or contain only whitespace.\n` +
    `   💡 Provide a valid collection name with --name option.`,

  CONVERSION_PARTIAL: (file: string, warnings: string[]): string =>
    `⚠️  Partial conversion for ${file}.\n` +
    `   Some features were converted with warnings:\n` +
    warnings.map((w) => `   - ${w}`).join('\n') +
    `\n   💡 Review the generated Postman collection and verify functionality.`,

  SCRIPT_CONVERSION_WARNING: (file: string, scriptType: 'pre-request' | 'test'): string =>
    `⚠️  Script conversion incomplete in ${file}.\n` +
    `   The ${scriptType} script contains Bruno-specific code that could not be\n` +
    `   automatically converted to Postman format.\n` +
    `   💡 Look for "// WARNING: partial conversion" comments in the output.`,

  BATCH_PARTIAL_FAILURE: (
    total: number,
    successful: number,
    failed: number
  ): string =>
    `⚠️  Batch conversion completed with errors.\n` +
    `   Total files: ${total}\n` +
    `   Successfully converted: ${successful}\n` +
    `   Failed: ${failed}\n` +
    `   💡 Review the error details below for failed conversions.`,
};

/**
 * Format a generic error for display
 */
export function formatError(error: Error, context?: string): string {
  const contextInfo = context ? `Context: ${context}\n   ` : '';
  return (
    `❌ An unexpected error occurred.\n` +
    `   ${contextInfo}Error: ${error.message}\n` +
    `   💡 If this persists, please report this issue with the full error details.`
  );
}

/**
 * Format validation errors into a readable list
 */
export function formatValidationErrors(errors: Array<{ path: string; message: string }>): string[] {
  return errors.map((err) => `${err.path}: ${err.message}`);
}
