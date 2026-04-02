'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  API_REGISTRY,
  callerFeature,
  getFeatureDomains,
} from '@/features/debug/model/api-registry';

import type {
  ApiEndpoint,
  HttpMethod,
} from '@/features/debug/model/api-registry';

// ── Method badge ───────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-sky-900/60 text-sky-300 border-sky-700/40',
  POST: 'bg-violet-900/60 text-violet-300 border-violet-700/40',
  PUT: 'bg-amber-900/60 text-amber-300 border-amber-700/40',
  PATCH: 'bg-orange-900/60 text-orange-300 border-orange-700/40',
  DELETE: 'bg-red-900/60 text-red-300 border-red-700/40',
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={[
        'inline-block shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border w-[52px] text-center',
        METHOD_COLORS[method],
      ].join(' ')}
    >
      {method}
    </span>
  );
}

// ── Path with param highlighting ───────────────────────────────────────────

function splitPathParts(path: string): string[] {
  const result: string[] = [];
  let remaining = path;

  while (remaining.length > 0) {
    const open = remaining.indexOf('{');

    if (open === -1) {
      result.push(remaining);
      break;
    }

    if (open > 0) result.push(remaining.slice(0, open));

    const close = remaining.indexOf('}', open);

    if (close === -1) {
      result.push(remaining.slice(open));
      break;
    }

    result.push(remaining.slice(open, close + 1));
    remaining = remaining.slice(close + 1);
  }

  return result;
}

function PathDisplay({ path }: { path: string }) {
  const parts = splitPathParts(path);

  return (
    <span className='font-mono text-xs'>
      {parts.map((part, i) => {
        return part.startsWith('{') ? (
          <span key={`p-${i}`} className='text-slate-500'>
            {part}
          </span>
        ) : (
          <span key={`p-${i}`} className='text-slate-200'>
            {part}
          </span>
        );
      })}
    </span>
  );
}

// ── Caller chip ────────────────────────────────────────────────────────────

function CallerChip({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const feature = callerFeature(path);
  const label = path.replace('features/', '').replace('/api/', '/');

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(path)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      })
      .catch(() => {
        /* clipboard access denied — ignore silently */
      });
  }, [path]);

  return (
    <button
      type='button'
      title={`Copy: ${path}`}
      onClick={handleCopy}
      className={[
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer',
        'bg-emerald-900/30 text-emerald-300 border-emerald-700/40 hover:bg-emerald-900/60',
      ].join(' ')}
    >
      <span className='text-emerald-500 text-[9px] font-bold uppercase'>
        {feature}
      </span>
      <span className='text-slate-400'>/</span>
      <span>{label.split('/').at(-1)}</span>
      {copied && <span className='text-emerald-400'>✓</span>}
    </button>
  );
}

// ── Single row ─────────────────────────────────────────────────────────────

function ApiEndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className='flex items-start gap-3 px-3 py-2 border-b border-white/5 hover:bg-white/3 transition-colors font-mono text-xs'>
      <MethodBadge method={endpoint.method} />

      <div className='flex-1 min-w-0'>
        <PathDisplay path={endpoint.path} />
      </div>

      <div
        className='shrink-0 w-[200px] text-slate-500 text-[10px] truncate'
        title={endpoint.controller}
      >
        {endpoint.controller}
      </div>

      <div className='shrink-0 w-[32px] text-center'>
        {endpoint.auth ? (
          <span title='Requires auth' className='text-amber-400'>
            🔒
          </span>
        ) : (
          <span title='Public' className='text-slate-600'>
            —
          </span>
        )}
      </div>

      <div className='shrink-0 w-[220px] flex flex-wrap gap-1'>
        {endpoint.frontendCallers.length > 0 ? (
          endpoint.frontendCallers.map((caller) => {
            return <CallerChip key={caller} path={caller} />;
          })
        ) : (
          <span className='text-slate-600'>—</span>
        )}
      </div>
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const FEATURE_DOMAINS = getFeatureDomains();

const btnBase =
  'px-2.5 py-1 rounded text-xs font-medium border transition-colors';
const activeBtn = 'bg-violet-700/80 border-violet-500 text-white';
const inactiveBtn =
  'bg-white/5 border-white/10 text-slate-400 hover:border-white/20';

interface Filters {
  method: string;
  feature: string;
  search: string;
  authOnly: boolean;
}

function FilterBar({
  filters,
  total,
  visible,
  onChange,
}: {
  filters: Filters;
  total: number;
  visible: number;
  onChange: (patch: Partial<Filters>) => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20'>
      {/* Method filter */}
      <div className='flex gap-1'>
        {(['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => {
          return (
            <button
              key={m || 'all'}
              type='button'
              className={[
                btnBase,
                filters.method === m ? activeBtn : inactiveBtn,
              ].join(' ')}
              onClick={() => {
                onChange({ method: m });
              }}
            >
              {m || 'All'}
            </button>
          );
        })}
      </div>

      <div className='w-px h-4 bg-white/10' />

      {/* Feature filter */}
      <select
        className='bg-white/5 border border-white/10 rounded text-xs text-slate-300 px-2 py-1'
        value={filters.feature}
        onChange={(e) => {
          onChange({ feature: e.target.value });
        }}
      >
        <option value=''>All features</option>
        {FEATURE_DOMAINS.map((f) => {
          return (
            <option key={f} value={f}>
              {f}
            </option>
          );
        })}
      </select>

      {/* Auth only */}
      <label className='flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none'>
        <input
          type='checkbox'
          className='accent-amber-500'
          checked={filters.authOnly}
          onChange={(e) => {
            onChange({ authOnly: e.target.checked });
          }}
        />
        Auth only
      </label>

      {/* Path search */}
      <input
        type='text'
        placeholder='Filter path…'
        className='flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded text-xs text-slate-300 placeholder:text-slate-600 px-2.5 py-1 focus:outline-none focus:border-violet-500/60'
        value={filters.search}
        onChange={(e) => {
          onChange({ search: e.target.value });
        }}
      />

      <span className='ml-auto text-xs text-slate-500 shrink-0'>
        {visible} / {total}
      </span>
    </div>
  );
}

// ── Table header ───────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className='flex items-center gap-3 px-3 py-1.5 border-b border-white/10 bg-black/30 text-[10px] font-semibold uppercase tracking-wider text-slate-500'>
      <span className='w-[52px] shrink-0'>Method</span>
      <span className='flex-1'>Path</span>
      <span className='shrink-0 w-[200px]'>Controller</span>
      <span className='shrink-0 w-[32px] text-center'>Auth</span>
      <span className='shrink-0 w-[220px]'>Frontend caller</span>
    </div>
  );
}

// ── Filter predicate ───────────────────────────────────────────────────────

function matchesSearch(endpoint: ApiEndpoint, search: string): boolean {
  if (search.length === 0) return true;
  const q = search.toLowerCase();

  return (
    endpoint.path.toLowerCase().includes(q) ||
    endpoint.controller.toLowerCase().includes(q)
  );
}

function matchesFeature(endpoint: ApiEndpoint, feature: string): boolean {
  if (feature.length === 0) return true;

  return endpoint.frontendCallers.some((c) => {
    return callerFeature(c) === feature;
  });
}

function matchesFilters(endpoint: ApiEndpoint, filters: Filters): boolean {
  if (filters.method.length > 0 && endpoint.method !== filters.method)
    return false;

  if (filters.authOnly && !endpoint.auth) return false;

  if (!matchesFeature(endpoint, filters.feature)) return false;

  if (!matchesSearch(endpoint, filters.search)) return false;

  return true;
}

// ── Main component ─────────────────────────────────────────────────────────

/**
 * ApiRegistryTable — filterable client-side table of all backend API routes.
 * Shows method, path, controller, auth flag, and which frontend Server Actions call each route.
 */
export function ApiRegistryTable() {
  const [filters, setFilters] = useState<Filters>({
    method: '',
    feature: '',
    search: '',
    authOnly: false,
  });

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => {
      return { ...f, ...patch };
    });
  }, []);

  const filtered = useMemo(() => {
    return API_REGISTRY.filter((e) => {
      return matchesFilters(e, filters);
    });
  }, [filters]);

  return (
    <div
      className='flex flex-col h-full rounded-lg overflow-hidden border border-white/10'
      style={{ background: 'rgba(8,8,22,0.85)' }}
    >
      {/* Header */}
      <div className='flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/30'>
        <h2 className='text-sm font-semibold text-white'>API Registry</h2>
        <span className='text-xs text-slate-500'>
          {API_REGISTRY.length} backend routes · {FEATURE_DOMAINS.length}{' '}
          frontend features
        </span>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        total={API_REGISTRY.length}
        visible={filtered.length}
        onChange={updateFilters}
      />

      {/* Column headers */}
      <TableHeader />

      {/* Rows */}
      <div className='flex-1 overflow-y-auto'>
        {filtered.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-slate-600 text-sm font-mono'>
            No endpoints match current filters.
          </div>
        ) : (
          filtered.map((endpoint) => {
            return (
              <ApiEndpointRow
                key={`${endpoint.method}-${endpoint.path}`}
                endpoint={endpoint}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
