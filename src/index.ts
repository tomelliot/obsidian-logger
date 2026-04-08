// Logger utility for consistent logging in Obsidian plugins.
// Provides console logging with a configurable prefix and optional file logging.
// Debug and info messages are only shown in development mode for console output.

const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

export interface FileLoggerConfig {
  /**
   * Returns true when debug logging to file should be active.
   * This should typically read the current settings at call time so it always
   * reflects the latest configuration without needing to reconfigure.
   */
  isDebugEnabled: () => boolean;

  /**
   * Append a single, already-formatted log line to the debug log file.
   * This function is responsible for any filesystem concerns, including
   * rotation and error handling. It must never throw.
   */
  appendLine: (line: string) => void | Promise<void>;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  configureFileLogging: (config: FileLoggerConfig | null) => void;
}

function serializeArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  return String(arg);
}

/**
 * Create a logger instance with the given prefix.
 *
 * @param prefix - The prefix to use in console log messages, e.g. "My Plugin"
 */
export function createLogger(prefix: string): Logger {
  const tag = `[${prefix}]`;
  let fileLoggerConfig: FileLoggerConfig | null = null;

  function logToFile(level: LogLevel, args: unknown[]): void {
    if (!fileLoggerConfig || !fileLoggerConfig.isDebugEnabled()) {
      return;
    }

    const timestamp = new Date().toISOString();
    const message = args.map(serializeArg).join(" ");
    const line = `${timestamp} [${level.toUpperCase()}] ${message}\n`;

    try {
      const result = fileLoggerConfig.appendLine(line);
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {
          // Swallow any async errors to avoid affecting plugin behavior
        });
      }
    } catch {
      // Swallow synchronous errors from appendLine as well
    }
  }

  return {
    debug: (...args: unknown[]) => {
      if (isDevelopment || fileLoggerConfig?.isDebugEnabled()) {
        console.debug(tag, ...args);
      }
      logToFile("debug", args);
    },

    info: (...args: unknown[]) => {
      if (isDevelopment || fileLoggerConfig?.isDebugEnabled()) {
        console.info(tag, ...args);
      }
      logToFile("info", args);
    },

    warn: (...args: unknown[]) => {
      console.warn(tag, ...args);
      logToFile("warn", args);
    },

    error: (...args: unknown[]) => {
      console.error(tag, ...args);
      logToFile("error", args);
    },

    configureFileLogging: (config: FileLoggerConfig | null) => {
      fileLoggerConfig = config;
    },
  };
}
