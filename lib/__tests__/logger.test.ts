import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info messages with timestamp and context', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('../logger');

    logger.info('User logged in', { userId: '123' });

    expect(spy).toHaveBeenCalledOnce();
    const loggedArg = spy.mock.calls[0][0];
    const parsed = JSON.parse(loggedArg);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('User logged in');
    expect(parsed.userId).toBe('123');
    expect(parsed.timestamp).toBeDefined();
  });

  it('logs errors with stack trace', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../logger');

    const error = new Error('Something broke');
    logger.error('Request failed', { error });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('Request failed');
    expect(parsed.error).toContain('Something broke');
  });

  it('logs warnings', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logger } = await import('../logger');

    logger.warn('Deprecated endpoint used', { path: '/api/old' });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('warn');
    expect(parsed.path).toBe('/api/old');
  });

  it('creates scoped logger', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('../logger');

    const authLogger = logger.child('auth');
    authLogger.info('Login attempt');

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.scope).toBe('auth');
  });
});
