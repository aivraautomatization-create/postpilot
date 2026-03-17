type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context: LogContext, scope?: string): string {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (scope) entry.scope = scope;

  if (context.error instanceof Error) {
    entry.error = context.error.message;
    const { error: _, ...rest } = context;
    Object.assign(entry, rest);
  } else {
    Object.assign(entry, context);
  }

  return JSON.stringify(entry);
}

function createLogger(scope?: string) {
  return {
    info(message: string, context: LogContext = {}) {
      console.log(formatLog('info', message, context, scope));
    },
    warn(message: string, context: LogContext = {}) {
      console.warn(formatLog('warn', message, context, scope));
    },
    error(message: string, context: LogContext = {}) {
      console.error(formatLog('error', message, context, scope));
    },
    child(childScope: string) {
      return createLogger(childScope);
    },
  };
}

export const logger = createLogger();
