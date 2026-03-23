'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { DebugLogEntry } from '@/shared/lib/debugLogBuffer';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 *
 * @param status
 */
function statusColor(status: number | undefined): string {
  if (!status) return 'text-red-400';

  if (status >= 500) return 'text-red-400';

  if (status >= 400) return 'text-amber-400';

  if (status >= 300) return 'text-blue-400';

  return 'text-emerald-400';
}

/**
 *
 * @param method
 */
function methodColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'text-sky-400',
    POST: 'text-violet-400',
    PUT: 'text-amber-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
  };

  return map[method] ?? 'text-slate-400';
}

/**
 *
 * @param source
 */
function sourceLabel(source: string): string {
  return source === 'server' ? 'SRV' : 'CLT';
}

/**
 *
 * @param source
 */
function sourceBadge(source: string): string {
  return source === 'server'
    ? 'bg-violet-900/60 text-violet-300 border border-violet-700/40'
    : 'bg-sky-900/60 text-sky-300 border border-sky-700/40';
}

/**
 *
 * @param kind
 */
function kindBadge(kind: string): string {
  if (kind === 'error')
    return 'bg-red-900/60 text-red-300 border border-red-700/40';

  if (kind === 'request')
    return 'bg-slate-800/60 text-slate-400 border border-slate-700/40';

  return 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40';
}

/**
 *
 * @param raw
 */
function tryPrettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/**
 *
 * @param url
 */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);

    return u.pathname + (u.search || '');
  } catch {
    return url;
  }
}

// ── Row ────────────────────────────────────────────────────────────────────

/**
 *
 * @param root0
 * @param root0.entry
 */
function LogRow({ entry }: { entry: DebugLogEntry }) {
  const [open, setOpen] = useState(false);

  const hasDetail =
    entry.body ||
    entry.headers ||
    entry.caller ||
    entry.cacheStatus ||
    entry.clientIp ||
    entry.userAgent ||
    entry.referer;

  return (
    <div
      className={[
        'border-b border-white/5 transition-colors',
        entry.slow ? 'bg-orange-950/20' : '',
        entry.kind === 'error' ? 'bg-red-950/20' : '',
      ].join(' ')}
    >
      {/* Summary row */}
      <button
        type='button'
        className={[
          'w-full text-left px-3 py-2 flex items-center gap-2 font-mono text-xs',
          hasDetail ? 'cursor-pointer hover:bg-white/5' : 'cursor-default',
        ].join(' ')}
        onClick={() => {
          if (hasDetail)
            setOpen((o) => {
              return !o;
            });
        }}
      >
        {/* Time */}
        <span className='text-slate-500 shrink-0 w-[148px]'>
          {entry.timestamp}
        </span>

        {/* Source badge */}
        <span
          className={[
            'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold',
            sourceBadge(entry.source),
          ].join(' ')}
        >
          {sourceLabel(entry.source)}
        </span>

        {/* Kind badge */}
        <span
          className={[
            'shrink-0 px-1.5 py-0.5 rounded text-[10px]',
            kindBadge(entry.kind),
          ].join(' ')}
        >
          {entry.kind}
        </span>

        {/* Method */}
        <span
          className={[
            'shrink-0 font-bold w-[52px]',
            methodColor(entry.method),
          ].join(' ')}
        >
          {entry.method}
        </span>

        {/* Status */}
        {entry.status !== undefined && (
          <span
            className={['shrink-0 w-[36px]', statusColor(entry.status)].join(
              ' ',
            )}
          >
            {entry.status || 'ERR'}
          </span>
        )}

        {/* URL */}
        <span className='flex-1 text-slate-300 truncate' title={entry.url}>
          {shortUrl(entry.url)}
        </span>

        {/* Duration */}
        {entry.durationMs !== undefined && (
          <span
            className={[
              'shrink-0',
              entry.slow ? 'text-orange-400 font-bold' : 'text-slate-500',
            ].join(' ')}
          >
            {entry.slow ? '\u26A0 ' : ''}
            {entry.durationMs}ms
          </span>
        )}

        {/* Size */}
        {entry.size !== undefined && (
          <span className='shrink-0 text-slate-500'>{entry.size}</span>
        )}

        {/* Cache */}
        {entry.cacheStatus && (
          <span
            className={[
              'shrink-0 text-[10px] px-1.5 py-0.5 rounded',
              entry.cacheStatus === 'HIT'
                ? 'bg-emerald-900/50 text-emerald-400'
                : 'bg-slate-800 text-slate-500',
            ].join(' ')}
          >
            {entry.cacheStatus}
          </span>
        )}

        {/* Expand arrow */}
        {hasDetail && (
          <span className='shrink-0 text-slate-600 ml-1'>
            {open ? '▲' : '▼'}
          </span>
        )}
      </button>

      {/* Detail panel */}
      {open && hasDetail && (
        <div className='px-4 pb-3 space-y-2 text-xs font-mono'>
          {/* Full URL (only when it has host) */}
          {entry.url.startsWith('http') && (
            <div>
              <span className='text-slate-500 mr-2'>URL</span>
              <span className='text-slate-300 break-all'>{entry.url}</span>
            </div>
          )}

          {/* Client metadata */}
          {(entry.clientIp ?? entry.userAgent ?? entry.referer) && (
            <div className='flex flex-wrap gap-x-4 gap-y-1'>
              {entry.clientIp && (
                <div>
                  <span className='text-slate-500 mr-1.5'>IP</span>
                  <span className='text-cyan-400'>{entry.clientIp}</span>
                </div>
              )}
              {entry.referer && (
                <div>
                  <span className='text-slate-500 mr-1.5'>Referer</span>
                  <span className='text-slate-300 break-all'>
                    {entry.referer}
                  </span>
                </div>
              )}
              {entry.userAgent && (
                <div className='w-full'>
                  <span className='text-slate-500 mr-1.5'>User-Agent</span>
                  <span className='text-slate-400 break-all'>
                    {entry.userAgent}
                  </span>
                </div>
              )}
            </div>
          )}

          {entry.headers && Object.keys(entry.headers).length > 0 && (
            <details>
              <summary className='text-slate-500 cursor-pointer select-none'>
                Headers ({Object.keys(entry.headers).length})
              </summary>
              <pre className='mt-1 p-2 bg-black/30 rounded text-slate-300 overflow-x-auto'>
                {JSON.stringify(entry.headers, null, 2)}
              </pre>
            </details>
          )}

          {entry.body && (
            <details open={entry.kind === 'error'}>
              <summary className='text-slate-500 cursor-pointer select-none'>
                Body
              </summary>
              <pre className='mt-1 p-2 bg-black/30 rounded text-slate-300 overflow-x-auto max-h-64'>
                {tryPrettyJson(entry.body)}
              </pre>
            </details>
          )}

          {entry.caller && (
            <div>
              <span className='text-slate-500 block mb-0.5'>Caller</span>
              <pre className='text-slate-400 whitespace-pre-wrap'>
                {entry.caller}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

type SourceFilter = 'all' | 'server' | 'client';
type KindFilter = 'all' | 'request' | 'response' | 'error';

interface Filters {
  source: SourceFilter;
  kind: KindFilter;
  method: string;
  search: string;
  slowOnly: boolean;
}

/**
 *
 * @param root0
 * @param root0.filters
 * @param root0.onChange
 * @param root0.onClear
 */
function FilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const btnBase =
    'px-2.5 py-1 rounded text-xs font-medium border transition-colors';

  const activeBtn = 'bg-violet-700/80 border-violet-500 text-white';

  const inactiveBtn =
    'bg-white/5 border-white/10 text-slate-400 hover:border-white/20';

  return (
    <div className='flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20'>
      {/* Source filter */}
      <div className='flex gap-1'>
        {(['all', 'server', 'client'] as SourceFilter[]).map((s) => {
          return (
            <button
              key={s}
              type='button'
              className={[
                btnBase,
                filters.source === s ? activeBtn : inactiveBtn,
              ].join(' ')}
              onClick={() => {
                return onChange({ source: s });
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className='w-px h-4 bg-white/10' />

      {/* Kind filter */}
      <div className='flex gap-1'>
        {(['all', 'request', 'response', 'error'] as KindFilter[]).map((k) => {
          return (
            <button
              key={k}
              type='button'
              className={[
                btnBase,
                filters.kind === k ? activeBtn : inactiveBtn,
              ].join(' ')}
              onClick={() => {
                return onChange({ kind: k });
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      <div className='w-px h-4 bg-white/10' />

      {/* Method filter */}
      <select
        className='bg-white/5 border border-white/10 rounded text-xs text-slate-300 px-2 py-1'
        value={filters.method}
        onChange={(e) => {
          return onChange({ method: e.target.value });
        }}
      >
        <option value=''>All methods</option>
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => {
          return (
            <option key={m} value={m}>
              {m}
            </option>
          );
        })}
      </select>

      {/* Slow only */}
      <label className='flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none'>
        <input
          type='checkbox'
          className='accent-orange-500'
          checked={filters.slowOnly}
          onChange={(e) => {
            return onChange({ slowOnly: e.target.checked });
          }}
        />
        Slow only
      </label>

      {/* URL search */}
      <input
        type='text'
        placeholder='Filter URL…'
        className='flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded text-xs text-slate-300 placeholder:text-slate-600 px-2.5 py-1 focus:outline-none focus:border-violet-500/60'
        value={filters.search}
        onChange={(e) => {
          return onChange({ search: e.target.value });
        }}
      />

      {/* Clear logs */}
      <button
        type='button'
        className='ml-auto text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700/60 rounded px-2.5 py-1 transition-colors'
        onClick={onClear}
      >
        Clear logs
      </button>
    </div>
  );
}

// ── Main viewer ────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;

/**
 *
 */
export function DebugLogsViewer() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  const [filters, setFilters] = useState<Filters>({
    source: 'all',
    kind: 'all',
    method: '',
    search: '',
    slowOnly: false,
  });

  const [autoScroll, setAutoScroll] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/debug-logs');

      const data = (await res.json()) as DebugLogEntry[];

      setLogs(data);
    } catch {
      /* silent */
    }
  }, []);

  // Polling
  useEffect(() => {
    // fetchLogs sets state asynchronously — rule false-positive.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs();

    const id = setInterval(() => {
      void fetchLogs();
    }, POLL_INTERVAL_MS);

    return () => {
      return clearInterval(id);
    };
  }, [fetchLogs]);

  // Auto-scroll to newest
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;

    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    setAutoScroll(atBottom);
  }, []);

  const clearLogs = useCallback(async () => {
    await fetch('/api/debug-logs?action=clear', { method: 'POST' });
    setLogs([]);
  }, []);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => {
      return { ...f, ...patch };
    });
  }, []);

  // Apply filters
  const visible = logs.filter((e) => {
    if (filters.source !== 'all' && e.source !== filters.source) return false;

    if (filters.kind !== 'all' && e.kind !== filters.kind) return false;

    if (filters.method && e.method !== filters.method) return false;

    if (filters.slowOnly && !e.slow) return false;

    if (
      filters.search.length > 0 &&
      !e.url.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div
      className='flex flex-col h-full rounded-lg overflow-hidden border border-white/10'
      style={{ background: 'rgba(8,8,22,0.85)' }}
    >
      {/* Header */}
      <div className='flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/30'>
        <h1 className='text-sm font-semibold text-white'>Debug Logs</h1>
        <span className='text-xs text-slate-500'>
          {visible.length} / {logs.length} entries
        </span>
        <span className='ml-auto flex items-center gap-1.5 text-xs text-slate-500'>
          <span
            className={[
              'w-2 h-2 rounded-full',
              'bg-emerald-500 animate-pulse',
            ].join(' ')}
          />
          Live (2s poll)
        </span>
        {!autoScroll && (
          <button
            type='button'
            className='text-xs text-sky-400 hover:text-sky-300'
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Jump to bottom
          </button>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearLogs}
      />

      {/* Log list */}
      <div
        ref={listRef}
        className='flex-1 overflow-y-auto'
        onScroll={handleScroll}
      >
        {visible.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-slate-600 text-sm font-mono'>
            {logs.length === 0
              ? 'No logs yet — make some requests.'
              : 'No entries match current filters.'}
          </div>
        ) : (
          // Logs are stored newest-first, show oldest first so new arrive at bottom
          visible.toReversed().map((entry) => {
            return (
              <LogRow
                key={`${entry.id}-${entry.kind}-${entry.source}-${entry.createdAt}`}
                entry={entry}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
