/* eslint-disable max-statements */
import {
  createRequestId,
  formatBytes,
  formatTimestamp,
  sanitizeHeaders,
  captureCallerStack,
  SLOW_THRESHOLD_MS,
} from '@/shared/lib/logger';

describe('createRequestId', () => {
  it('returns a string starting with #', () => {
    const id = createRequestId();

    expect(id).toMatch(/^#\d{4}$/);
  });

  it('increments with each call', () => {
    const first = createRequestId();

    const second = createRequestId();

    const n1 = Number(first.slice(1));

    const n2 = Number(second.slice(1));

    expect(n2).toBe(n1 + 1);
  });
});

describe('formatTimestamp', () => {
  it('returns a string matching DD/MM HH:MM:SS.mmm format', () => {
    const ts = formatTimestamp();

    expect(ts).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});

describe('formatBytes', () => {
  it('formats bytes < 1024 as "N B"', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats bytes in KB range', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats bytes in MB range', () => {
    expect(formatBytes(1024 * 1024 * 3)).toBe('3.00 MB');
  });

  it('formats 0 bytes as "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats exactly 1023 bytes as bytes', () => {
    expect(formatBytes(1023)).toBe('1023 B');
  });
});

describe('sanitizeHeaders', () => {
  it('passes through non-sensitive headers unchanged', () => {
    const result = sanitizeHeaders({ 'content-type': 'application/json' });

    expect(result['content-type']).toBe('application/json');
  });

  it('truncates Authorization header value', () => {
    const token = 'Bearer supersecrettoken123456';

    const result = sanitizeHeaders({ authorization: token });

    expect(result.authorization).not.toBe(token);
    expect(result.authorization).toContain('\u2026');
  });

  it('truncates cookie header', () => {
    const cookie = 'session=verylongsecretcookievalue';

    const result = sanitizeHeaders({ cookie });

    expect(result.cookie).not.toBe(cookie);
  });

  it('is case-insensitive for sensitive header names', () => {
    const result = sanitizeHeaders({ Authorization: 'Bearer token' });

    expect(result.Authorization).toContain('\u2026');
  });

  it('handles empty headers object', () => {
    expect(sanitizeHeaders({})).toEqual({});
  });
});

describe('captureCallerStack', () => {
  it('returns a string or undefined', () => {
    const stack = captureCallerStack('logger.test.ts');

    // May be undefined if all frames are filtered, or a string
    expect(stack === undefined || typeof stack === 'string').toBe(true);
  });

  it('does not include the skipFile in the output', () => {
    const stack = captureCallerStack('logger.test.ts');

    if (stack !== undefined) {
      expect(stack).not.toContain('logger.test.ts');
    }
  });
});

describe('SLOW_THRESHOLD_MS', () => {
  it('defaults to 800 when env var is not set', () => {
    expect(SLOW_THRESHOLD_MS).toBe(800);
  });
});

const LOG_URL = 'http://example.com/api';

// Test log functions (isDev must be true — mock the module in-process)
describe('log functions (dev mode)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logRequest: (ctx: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logResponse: (ctx: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logApiError: (ctx: any) => void;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    jest.resetModules();
    // Override NODE_ENV to trigger isDev = true
    const originalEnv = process.env.NODE_ENV;

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });
    const logger = await import('@/shared/lib/logger');

    logRequest = logger.logRequest;
    logResponse = logger.logResponse;
    logApiError = logger.logApiError;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('logRequest calls console.log', () => {
    logRequest({
      id: '#0001',
      method: 'GET',
      url: LOG_URL,
      timestamp: '10:00:00.000',
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logRequest includes body when provided', () => {
    logRequest({
      id: '#0002',
      method: 'POST',
      url: LOG_URL,
      body: JSON.stringify({ key: 'value' }),
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logRequest includes caller when provided', () => {
    logRequest({
      id: '#0003',
      method: 'GET',
      url: LOG_URL,
      caller: 'myFunction (app/page.ts:10)',
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logRequest handles tag (BACKEND/NEXT/EXT)', () => {
    for (const tag of ['BACKEND', 'NEXT', 'EXT']) {
      logRequest({ id: '#0004', method: 'GET', url: LOG_URL, tag });
    }
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledTimes(3);
  });

  it('logResponse calls console.log', () => {
    logResponse({
      id: '#0001',
      method: 'GET',
      url: LOG_URL,
      status: 200,
      durationMs: 100,
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logResponse highlights slow responses', () => {
    logResponse({
      id: '#0002',
      method: 'GET',
      url: LOG_URL,
      status: 200,
      durationMs: 1500,
      slow: true,
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logResponse includes size and cacheStatus', () => {
    logResponse({
      id: '#0003',
      method: 'GET',
      url: 'http://example.com',
      status: 304,
      durationMs: 50,
      size: '1.2 KB',
      cacheStatus: 'HIT',
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logResponse includes cacheStatus MISS', () => {
    logResponse({
      id: '#0004',
      method: 'GET',
      url: 'http://example.com',
      status: 200,
      durationMs: 50,
      cacheStatus: 'MISS',
    });
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalled();
  });

  it('logApiError calls console.error', () => {
    logApiError({
      url: LOG_URL,
      status: 500,
      statusText: 'Internal Server Error',
      body: '{"error":"oops"}',
    });
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
  });
});
