import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Logger } from '../../../src/services/logger.js';

describe('Logger', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Human-readable mode', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger({ jsonOutput: false });
    });

    it('should log info messages in English', () => {
      logger.info('Processing file');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing file'));
    });

    it('should log success messages with checkmark', () => {
      logger.success('Conversion successful');
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('✓');
      expect(output).toContain('Conversion successful');
    });

    it('should log warning messages with symbol', () => {
      logger.warn('Partial conversion');
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('⚠');
      expect(output).toContain('Partial conversion');
    });

    it('should log error messages to stderr', () => {
      logger.error('Failed to parse file');
      const output = (consoleErrorSpy.mock.calls[0] as string[])[0];
      expect(output).toContain('✗');
      expect(output).toContain('Failed to parse file');
    });

    it('should not log verbose messages when verbose is false', () => {
      logger.verbose('Debug information');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log verbose messages when verbose is true', () => {
      const verboseLogger = new Logger({ jsonOutput: false, verbose: true });
      verboseLogger.verbose('Debug information');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Debug information'));
    });

    it('should include timestamp in verbose mode', () => {
      const verboseLogger = new Logger({ jsonOutput: false, verbose: true });
      verboseLogger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\d{2}:\d{2}:\d{2}/));
    });
  });

  describe('JSON output mode', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger({ jsonOutput: true });
    });

    it('should output info messages as JSON', () => {
      logger.info('Processing file');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"info".*"message":"Processing file"/)
      );
    });

    it('should output success messages as JSON', () => {
      logger.success('Conversion successful');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"success".*"message":"Conversion successful"/)
      );
    });

    it('should output warning messages as JSON', () => {
      logger.warn('Partial conversion');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"warn".*"message":"Partial conversion"/)
      );
    });

    it('should output error messages as JSON to stderr', () => {
      logger.error('Failed to parse file');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"error".*"message":"Failed to parse file"/)
      );
    });

    it('should include timestamp in JSON output', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/"timestamp":/));
    });

    it('should not output verbose messages when verbose is false', () => {
      logger.verbose('Debug information');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should output verbose messages as JSON when verbose is true', () => {
      const verboseLogger = new Logger({ jsonOutput: true, verbose: true });
      verboseLogger.verbose('Debug information');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"verbose".*"message":"Debug information"/)
      );
    });

    it('should produce valid JSON', () => {
      logger.info('Test message');
      const output = (consoleLogSpy.mock.calls[0] as string[])[0];
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });

  describe('startSpinner and stopSpinner', () => {
    it('should not throw in JSON mode', () => {
      const logger = new Logger({ jsonOutput: true });
      expect(() => {
        logger.startSpinner('Processing...');
        logger.stopSpinner('Done');
      }).not.toThrow();
    });

    it('should work in human-readable mode', () => {
      const logger = new Logger({ jsonOutput: false });
      expect(() => {
        logger.startSpinner('Processing...');
        logger.stopSpinner('Done');
      }).not.toThrow();
    });
  });
});
