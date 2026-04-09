describe('shared/lib/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports API_URL when API_URL env var is set', async () => {
    process.env = { ...originalEnv, API_URL: 'http://api.example.com' };
    const config = await import('@/shared/lib/config');

    expect(config.API_URL).toBe('http://api.example.com');
  });

  it('throws when API_URL is missing and not in build phase', () => {
    process.env = {
      ...originalEnv,
      API_URL: undefined,
      NEXT_PHASE: undefined,
    };
    expect(() => {
      // Using require so the module is evaluated synchronously
      // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
      require('@/shared/lib/config');
    }).toThrow('API_URL is not defined');
  });

  it('does NOT throw during next build phase even without API_URL', () => {
    process.env = {
      ...originalEnv,
      API_URL: undefined,
      NEXT_PHASE: 'phase-production-build',
    };
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
      require('@/shared/lib/config');
    }).not.toThrow();
  });
});
