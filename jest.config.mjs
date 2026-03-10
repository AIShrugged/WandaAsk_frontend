// @ts-nocheck
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],

  collectCoverageFrom: [
    'features/**/*.{ts,tsx}',
    'shared/lib/**/*.ts',
    'shared/ui/**/*.{ts,tsx}',
    'entities/**/*.{ts,tsx}',
    'widgets/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/index.ts',
    '!**/*.d.ts',
    '!**/api/**',
  ],

  coverageThreshold: {
    global: {
      branches: 20,
      functions: 24,
      lines: 23,
      statements: 22,
    },
  },

  coverageReporters: ['text', 'lcov', 'text-summary'],
});
