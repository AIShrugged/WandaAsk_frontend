/**
 * In-memory ring buffer for server-side debug logs.
 * Holds the last MAX_ENTRIES request/response pairs.
 * Active only in development; the buffer is always empty in production.
 */

import { isDev } from '@/shared/lib/logger';

export type LogSource = 'server' | 'client';
export type LogEntryKind = 'request' | 'response' | 'error';

export interface DebugLogEntry {
  id: string;
  kind: LogEntryKind;
  source: LogSource;
  /** HH:MM:SS.mmm */
  timestamp: string;
  method: string;
  url: string;
  /** Present on response/error */
  status?: number;
  durationMs?: number;
  /** Human-readable size e.g. "4.2 KB" */
  size?: string;
  /** "HIT" | "MISS" | "STALE" */
  cacheStatus?: string;
  slow?: boolean;
  headers?: Record<string, string>;
  body?: string;
  caller?: string;
  tag?: string;
  /** ISO timestamp for sorting */
  createdAt: number;
}

const MAX_ENTRIES = 300;

// Single global buffer — lives for the lifetime of the Node.js process.
const SYM = Symbol.for('__tribes_debug_log_buffer');

type Globals = typeof globalThis & { [SYM]?: DebugLogEntry[] };

/**
 * Returns the shared buffer reference (creates it once per process).
 */
function getBuffer(): DebugLogEntry[] {
  const g = globalThis as Globals;

  if (!g[SYM]) g[SYM] = [];

  return g[SYM];
}

/**
 * Push a new entry to the ring buffer.
 * No-op in production.
 * @param entry
 */
export function pushLog(entry: DebugLogEntry): void {
  if (!isDev) return;

  const buf = getBuffer();

  buf.push(entry);

  // Trim to MAX_ENTRIES from the end (keep newest).
  if (buf.length > MAX_ENTRIES) {
    buf.splice(0, buf.length - MAX_ENTRIES);
  }
}

/**
 * Returns a snapshot of all entries, newest first.
 */
export function getLogs(): DebugLogEntry[] {
  if (!isDev) return [];

  return getBuffer().toReversed();
}

/**
 * Clear all entries.
 */
export function clearLogs(): void {
  const buf = getBuffer();

  buf.length = 0;
}