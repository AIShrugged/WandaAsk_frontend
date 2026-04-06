/* eslint-disable max-statements */

const mockCaptureCallerStack = jest.fn().mockReturnValue();
const mockFormatTimestamp = jest.fn().mockReturnValue('10:00:00.000');
const mockFormatBytes = jest.fn((n: number) => {
  return `${String(n)} B`;
});

jest.mock('@/shared/lib/logger', () => {
  return {
    isDev: true,
    SLOW_THRESHOLD_MS: 800,
    captureCallerStack: (...args: unknown[]) => {
      return mockCaptureCallerStack(...args);
    },
    formatTimestamp: () => {
      return mockFormatTimestamp();
    },
    formatBytes: (n: number) => {
      return mockFormatBytes(n);
    },
  };
});

import { installClientFetchDebugger } from '@/shared/lib/devFetchInterceptor';

const PATCHED_KEY = '__tribes_fetch_debug_patched';

/**
 * Minimal Response-like mock.
 * @param body
 * @param status
 * @param headers
 */
function makeRes(
  body = '',
  status = 200,
  headers: Record<string, string> = {},
): Response {
  const hdrs = new Headers(headers);

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: hdrs,
    clone: () => {
      return makeRes(body, status, headers);
    },
    text: () => {
      return Promise.resolve(body);
    },
  } as unknown as Response;
}

describe('installClientFetchDebugger', () => {
  let originalFetch: typeof globalThis.fetch;
  let consoleSpy: jest.SpyInstance;
  let consoleGroupSpy: jest.SpyInstance;
  let consoleGroupEndSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = globalThis.fetch;

    // jsdom may not define fetch — provide a stub so the interceptor can bind it
    if (!globalThis.fetch) {
      globalThis.fetch = jest.fn().mockResolvedValue(makeRes());
    }
    // Remove patch flag between tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any)[PATCHED_KEY];

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    consoleGroupSpy = jest
      .spyOn(console, 'groupCollapsed')
      .mockImplementation(() => {});

    consoleGroupEndSpy = jest
      .spyOn(console, 'groupEnd')
      .mockImplementation(() => {});

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any)[PATCHED_KEY];
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('returns a cleanup function', () => {
    const cleanup = installClientFetchDebugger();

    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('patches globalThis.fetch', () => {
    const before = globalThis.fetch;

    installClientFetchDebugger();
    expect(globalThis.fetch).not.toBe(before);
  });

  it('does not double-patch on second call', () => {
    installClientFetchDebugger();
    const afterFirst = globalThis.fetch;

    installClientFetchDebugger();
    expect(globalThis.fetch).toBe(afterFirst);
  });

  it('restores original fetch wrapper name after cleanup', () => {
    const cleanup = installClientFetchDebugger();

    // The wrapper function is named "debugFetch"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis.fetch as any).name).toBe('debugFetch');
    cleanup();
    // After cleanup the patch flag is cleared, so a re-install can patch again
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any)[PATCHED_KEY]).toBeUndefined();
  });

  it('logs a request group for non-skipped URLs', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeRes('{}', 200, { 'content-type': 'application/json' }),
      );
    installClientFetchDebugger();
    await globalThis.fetch('http://example.com/api/data');
    // eslint-disable-next-line no-console
    expect(console.groupCollapsed).toHaveBeenCalled();
  });

  it('skips /_next/ URLs without logging', async () => {
    const mockFetch = jest.fn().mockResolvedValue(makeRes());

    globalThis.fetch = mockFetch;
    installClientFetchDebugger();
    await globalThis.fetch('http://localhost:3000/_next/static/chunk.js');
    // eslint-disable-next-line no-console
    expect(console.groupCollapsed).not.toHaveBeenCalled();
  });

  it('skips _rsc= URLs without logging', async () => {
    const mockFetch = jest.fn().mockResolvedValue(makeRes());

    globalThis.fetch = mockFetch;
    installClientFetchDebugger();
    await globalThis.fetch('http://localhost:3000/page?_rsc=abc');
    // eslint-disable-next-line no-console
    expect(console.groupCollapsed).not.toHaveBeenCalled();
  });

  it('injects X-Debug-Request-ID header into the underlying request', async () => {
    // sendToBuffer() also calls the underlying fetch (for /api/debug-logs),
    // so we capture all calls and find the one for our actual URL.
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];

    globalThis.fetch = jest
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        let url: string;

        if (typeof input === 'string') {
          url = input;
        } else if (input instanceof URL) {
          url = input.href;
        } else {
          url = (input as Request).url;
        }

        calls.push({ url, init });

        return Promise.resolve(makeRes());
      });
    installClientFetchDebugger();
    await globalThis.fetch('http://example.com/api');

    const realCall = calls.find((c) => {
      return c.url === 'http://example.com/api';
    });
    const h = realCall?.init?.headers;
    // h may be a Headers instance or a plain object depending on the environment
    let debugId: string | null | undefined;

    if (h != null && typeof (h as Headers).get === 'function') {
      debugId = (h as Headers).get('X-Debug-Request-ID');
    } else {
      const plain = h as Record<string, string> | undefined;

      debugId = plain?.['X-Debug-Request-ID'] ?? plain?.['x-debug-request-id'];
    }

    expect(debugId).toBeTruthy();
  });

  it('logs an error group when fetch throws', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Net failure'));
    installClientFetchDebugger();
    await expect(globalThis.fetch('http://example.com/api')).rejects.toThrow(
      'Net failure',
    );
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalled();
  });

  it('uses content-length header for response size', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeRes('hello', 200, {
        'content-length': '5',
        'content-type': 'text/plain',
      }),
    );
    installClientFetchDebugger();
    await globalThis.fetch('http://example.com/sized');
    expect(mockFormatBytes).toHaveBeenCalledWith(5);
  });

  it('does not clone body for streaming responses', async () => {
    const cloneSpy = jest.fn();
    const streamRes = makeRes('data: hi\n\n', 200, {
      'content-type': 'text/event-stream',
    });

    streamRes.clone = cloneSpy as unknown as typeof streamRes.clone;
    globalThis.fetch = jest.fn().mockResolvedValue(streamRes);
    installClientFetchDebugger();
    await globalThis.fetch('http://example.com/stream');
    expect(cloneSpy).not.toHaveBeenCalled();
  });

  it('handles URL objects as input', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeRes());
    installClientFetchDebugger();
    await globalThis.fetch(new URL('http://example.com/api'));
    // eslint-disable-next-line no-console
    expect(console.groupCollapsed).toHaveBeenCalled();
  });
});
