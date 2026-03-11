export { APP_NAME } from './app-name';

const rawApiUrl = process.env.API_URL;

// Skip the throw during `next build` (NEXT_PHASE = 'phase-production-build').
// All callers are Server Actions that run at request time, so the error will
// surface on the first request if the var is missing in the runtime env.
if (!rawApiUrl && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('API_URL is not defined');
}

export const API_URL = rawApiUrl as string;
