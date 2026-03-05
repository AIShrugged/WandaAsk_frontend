// ------------------------------
// Typed application error classes
// Carry source, HTTP status, URL, and response body for rich error display in dev.
// In production, only `message` and `digest` survive the server→client boundary.
// ------------------------------

export type ErrorSource = 'server' | 'frontend' | 'network' | 'unknown';

export interface AppErrorOptions {
  source?: ErrorSource;
  status?: number;
  url?: string;
  responseBody?: string;
}

/**
 * AppError class.
 */
export class AppError extends Error {
  readonly source: ErrorSource;
  readonly status?: number;
  readonly url?: string;
  readonly responseBody?: string;

  /**
   * Creates an instance.
   * @param message - message.
   * @param options - options.
   */
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.source = options.source ?? 'unknown';
    this.status = options.status;
    this.url = options.url;
    this.responseBody = options.responseBody;
  }
}

/** Thrown when the Laravel backend returns a non-2xx response. */
export class ServerError extends AppError {
  /**
   * Creates an instance.
   * @param message - message.
   * @param options - options.
   */
  constructor(message: string, options: Omit<AppErrorOptions, 'source'> = {}) {
    super(message, { ...options, source: 'server' });
    this.name = 'ServerError';
  }
}

/** Thrown for client-side logic errors (validation, unexpected state, etc.). */
export class FrontendError extends AppError {
  /**
   * Creates an instance.
   * @param message - message.
   */
  constructor(message: string) {
    super(message, { source: 'frontend' });
    this.name = 'FrontendError';
  }
}

/** Thrown when a network request fails entirely (no response received). */
export class NetworkError extends AppError {
  /**
   * Creates an instance.
   * @param message - message.
   * @param options - options.
   */
  constructor(message: string, options: Omit<AppErrorOptions, 'source'> = {}) {
    super(message, { ...options, source: 'network' });
    this.name = 'NetworkError';
  }
}

/**
 * isAppError.
 * @param error - error.
 * @returns Result.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
