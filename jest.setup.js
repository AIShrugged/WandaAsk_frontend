import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// Polyfill for next/cache and other server APIs imported transitively via feature indexes
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// Prevent @/shared/lib/config from throwing when API modules are imported via feature indexes
if (!process.env.API_URL) {
  process.env.API_URL = 'https://test.local';
}
