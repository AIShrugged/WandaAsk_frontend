/* eslint-disable max-statements */

const mockLogRequest = jest.fn();
const mockLogResponse = jest.fn();
const mockLogApiError = jest.fn();

jest.mock('@/shared/lib/logger', () => {
  return {
    isDev: true,
    SLOW_THRESHOLD_MS: 800,
    createRequestId: jest.fn().mockReturnValue('#0001'),
    formatTimestamp: jest.fn().mockReturnValue('10:00:00.000'),
    formatBytes: jest.fn((n: number) => {
      return `${String(n)} B`;
    }),
    captureCallerStack: jest.fn().mockReturnValue(),
    sanitizeHeaders: jest.fn((h: Record<string, string>) => {
      return h;
    }),
    logRequest: (...args: unknown[]) => {
      return mockLogRequest(...args);
    },
    logResponse: (...args: unknown[]) => {
      return mockLogResponse(...args);
    },
    logApiError: (...args: unknown[]) => {
      return mockLogApiError(...args);
    },
  };
});

import { patchServerFetch } from '@/shared/lib/fetchDebugger';

const PATCHED_SYM = Symbol.for('__tribes_fetch_debug_patched');
const API_URL = 'http://example.com/api';

/**
 * Minimal Response-like mock accepted by the debugger.
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

describe('patchServerFetch', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = globalThis.fetch;
    // Remove patch flag between tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any)[PATCHED_SYM];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any)[PATCHED_SYM];
  });

  it('replaces globalThis.fetch with a wrapper', () => {
    const before = globalThis.fetch;

    patchServerFetch();
    expect(globalThis.fetch).not.toBe(before);
  });

  it('does not double-patch on second call', () => {
    patchServerFetch();
    const afterFirst = globalThis.fetch;

    patchServerFetch();
    expect(globalThis.fetch).toBe(afterFirst);
  });

  it('calls logRequest when a request is made', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeRes('ok', 200, { 'content-type': 'text/plain' }));
    patchServerFetch();
    await globalThis.fetch('http://example.com/api/test');
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://example.com/api/test',
        method: 'GET',
      }),
    );
  });

  it('calls logResponse after a successful response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeRes('{"ok":true}', 200, { 'content-type': 'application/json' }),
      );
    patchServerFetch();
    await globalThis.fetch('http://example.com/api/data');
    expect(mockLogResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        url: 'http://example.com/api/data',
      }),
    );
  });

  it('skips /_next/ URLs without logging', async () => {
    const mockFetch = jest.fn().mockResolvedValue(makeRes());

    globalThis.fetch = mockFetch;
    patchServerFetch();
    await globalThis.fetch('http://localhost:3000/_next/static/chunk.js');
    expect(mockLogRequest).not.toHaveBeenCalled();
  });

  it('skips webpack-hmr URLs without logging', async () => {
    const mockFetch = jest.fn().mockResolvedValue(makeRes());

    globalThis.fetch = mockFetch;
    patchServerFetch();
    await globalThis.fetch('http://localhost:3000/webpack-hmr');
    expect(mockLogRequest).not.toHaveBeenCalled();
  });

  it('injects X-Debug-Request-ID header into the request', async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = jest
      .fn()
      .mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
        capturedInit = init;

        return Promise.resolve(makeRes());
      });
    patchServerFetch();
    await globalThis.fetch(API_URL);
    const headers = capturedInit?.headers as Headers;

    expect(headers.get('X-Debug-Request-ID')).toBe('#0001');
  });

  it('calls logApiError when the fetch throws', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('Network failure'));
    patchServerFetch();
    await expect(globalThis.fetch(API_URL)).rejects.toThrow('Network failure');
    expect(mockLogApiError).toHaveBeenCalledWith(
      expect.objectContaining({ url: API_URL, status: 0 }),
    );
  });

  it('calls logResponse with slow=true when durationMs > SLOW_THRESHOLD_MS', async () => {
    const startSpy = jest.spyOn(performance, 'now');

    startSpy.mockReturnValueOnce(0).mockReturnValueOnce(1000); // 1000ms duration
    globalThis.fetch = jest.fn().mockResolvedValue(makeRes('', 200));
    patchServerFetch();
    await globalThis.fetch('http://example.com/slow');
    expect(mockLogResponse).toHaveBeenCalledWith(
      expect.objectContaining({ slow: true }),
    );
    startSpy.mockRestore();
  });

  it('does not read body for streaming responses', async () => {
    const cloneSpy = jest.fn();
    const streamRes = makeRes('data: chunk\n\n', 200, {
      'content-type': 'text/event-stream',
    });

    streamRes.clone = cloneSpy as unknown as typeof streamRes.clone;
    globalThis.fetch = jest.fn().mockResolvedValue(streamRes);
    patchServerFetch();
    await globalThis.fetch('http://example.com/stream');
    expect(cloneSpy).not.toHaveBeenCalled();
  });

  it('uses content-length header for size if available', async () => {
    const { formatBytes } = await import('@/shared/lib/logger');

    globalThis.fetch = jest.fn().mockResolvedValue(
      makeRes('hello', 200, {
        'content-length': '5',
        'content-type': 'text/plain',
      }),
    );
    patchServerFetch();
    await globalThis.fetch('http://example.com/sized');
    expect(formatBytes).toHaveBeenCalledWith(5);
  });

  it('includes cacheStatus from x-nextjs-cache header', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeRes('', 200, { 'x-nextjs-cache': 'HIT' }));
    patchServerFetch();
    await globalThis.fetch('http://example.com/cached');
    expect(mockLogResponse).toHaveBeenCalledWith(
      expect.objectContaining({ cacheStatus: 'HIT' }),
    );
  });

  it('passes POST method and body correctly', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeRes());
    patchServerFetch();
    await globalThis.fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ key: 'val' }),
    });
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', body: '{"key":"val"}' }),
    );
  });
});
