import chalk from 'chalk';
import ora, { Ora } from 'ora';

export interface LoggerOptions {
  jsonOutput?: boolean;
  verbose?: boolean;
}

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'verbose';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
}

/**
 * Logger class for human-readable and JSON output
 */
export class Logger {
  private jsonOutput: boolean;
  private isVerbose: boolean;
  private spinner: Ora | null = null;

  constructor(options: LoggerOptions = {}) {
    this.jsonOutput = options.jsonOutput ?? false;
    this.isVerbose = options.verbose ?? false;
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    this.log('info', message);
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    this.log('success', message);
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    this.log('warn', message);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    this.log('error', message, true);
  }

  /**
   * Log a verbose/debug message (only if verbose mode is enabled)
   */
  verbose(message: string): void {
    if (this.isVerbose) {
      this.log('verbose', message);
    }
  }

  /**
   * Start a spinner for long-running operations
   */
  startSpinner(message: string): void {
    if (this.jsonOutput) {
      // In JSON mode, just log the start
      this.info(message);
      return;
    }

    this.spinner = ora({
      text: message,
      color: 'cyan',
    }).start();
  }

  /**
   * Stop the spinner with a success or failure message
   */
  stopSpinner(message: string, success = true): void {
    if (!this.spinner) {
      // No spinner running, just log
      if (success) {
        this.success(message);
      } else {
        this.error(message);
      }
      return;
    }

    if (success) {
      this.spinner.succeed(message);
    } else {
      this.spinner.fail(message);
    }

    this.spinner = null;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, isError = false): void {
    if (this.jsonOutput) {
      this.logJson(level, message, isError);
    } else {
      this.logHuman(level, message, isError);
    }
  }

  /**
   * Log in JSON format
   */
  private logJson(level: LogLevel, message: string, isError: boolean): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    const output = JSON.stringify(entry);

    if (isError) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Log in human-readable format with colors
   */
  private logHuman(level: LogLevel, message: string, isError: boolean): void {
    let prefix = '';
    let coloredMessage = message;

    // Add timestamp in verbose mode
    const timestamp = this.isVerbose ? `[${this.getTimeString()}] ` : '';

    switch (level) {
      case 'info':
        coloredMessage = chalk.white(message);
        break;
      case 'success':
        prefix = chalk.green('✓');
        coloredMessage = chalk.green(message);
        break;
      case 'warn':
        prefix = chalk.yellow('⚠');
        coloredMessage = chalk.yellow(message);
        break;
      case 'error':
        prefix = chalk.red('✗');
        coloredMessage = chalk.red(message);
        break;
      case 'verbose':
        prefix = chalk.gray('→');
        coloredMessage = chalk.gray(message);
        break;
    }

    const output = prefix
      ? `${timestamp}${prefix} ${coloredMessage}`
      : `${timestamp}${coloredMessage}`;

    if (isError) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Get current time as HH:MM:SS string
   */
  private getTimeString(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}
