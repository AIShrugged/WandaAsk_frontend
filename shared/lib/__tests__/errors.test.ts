import {
  AppError,
  FrontendError,
  isAppError,
  NetworkError,
  ServerError,
} from '@/shared/lib/errors';

describe('AppError', () => {
  it('sets message and name', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.name).toBe('AppError');
  });

  it('defaults source to "unknown"', () => {
    const error = new AppError('msg');
    expect(error.source).toBe('unknown');
  });

  it('accepts all options', () => {
    const error = new AppError('msg', {
      source: 'server',
      status: 500,
      url: '/api/test',
      responseBody: '{"error":"Internal"}',
    });
    expect(error.source).toBe('server');
    expect(error.status).toBe(500);
    expect(error.url).toBe('/api/test');
    expect(error.responseBody).toBe('{"error":"Internal"}');
  });

  it('is an instance of Error', () => {
    expect(new AppError('msg')).toBeInstanceOf(Error);
  });
});

describe('ServerError', () => {
  it('sets source to "server"', () => {
    const error = new ServerError('Not found', { status: 404 });
    expect(error.source).toBe('server');
    expect(error.status).toBe(404);
    expect(error.name).toBe('ServerError');
  });

  it('is an instance of AppError', () => {
    expect(new ServerError('msg')).toBeInstanceOf(AppError);
  });

  it('works without options', () => {
    const error = new ServerError('Service unavailable');
    expect(error.message).toBe('Service unavailable');
    expect(error.status).toBeUndefined();
  });
});

describe('FrontendError', () => {
  it('sets source to "frontend"', () => {
    const error = new FrontendError('Validation failed');
    expect(error.source).toBe('frontend');
    expect(error.name).toBe('FrontendError');
  });

  it('is an instance of AppError', () => {
    expect(new FrontendError('msg')).toBeInstanceOf(AppError);
  });
});

describe('NetworkError', () => {
  it('sets source to "network"', () => {
    const error = new NetworkError('Connection refused');
    expect(error.source).toBe('network');
    expect(error.name).toBe('NetworkError');
  });

  it('accepts url option', () => {
    const error = new NetworkError('Timeout', { url: 'https://api.example.com' });
    expect(error.url).toBe('https://api.example.com');
  });

  it('is an instance of AppError', () => {
    expect(new NetworkError('msg')).toBeInstanceOf(AppError);
  });
});

describe('isAppError', () => {
  it('returns true for AppError', () => {
    expect(isAppError(new AppError('msg'))).toBe(true);
  });

  it('returns true for ServerError (subclass)', () => {
    expect(isAppError(new ServerError('msg'))).toBe(true);
  });

  it('returns true for FrontendError', () => {
    expect(isAppError(new FrontendError('msg'))).toBe(true);
  });

  it('returns true for NetworkError', () => {
    expect(isAppError(new NetworkError('msg'))).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isAppError(new Error('msg'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAppError(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isAppError('error string')).toBe(false);
  });
});