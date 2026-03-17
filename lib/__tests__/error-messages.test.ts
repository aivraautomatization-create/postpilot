import { describe, it, expect } from 'vitest';
import { getErrorMessage, sanitizeErrorForClient } from '../error-messages';

describe('getErrorMessage', () => {
  it('returns mapped message for known error code', () => {
    expect(getErrorMessage('RATE_LIMITED')).toContain('too quickly');
  });

  it('returns fallback for unknown code', () => {
    expect(getErrorMessage('UNKNOWN_CODE', 'Custom fallback')).toBe('Custom fallback');
  });

  it('returns default message when no code or fallback', () => {
    expect(getErrorMessage()).toBe('Something went wrong. Please try again.');
  });
});

describe('sanitizeErrorForClient', () => {
  it('returns generic message for unknown errors', () => {
    const result = sanitizeErrorForClient(new Error('connect ECONNREFUSED 127.0.0.1:5432'));
    expect(result).not.toContain('ECONNREFUSED');
    expect(result).not.toContain('127.0.0.1');
    expect(result).toBe('Something went wrong. Please try again.');
  });

  it('strips stack traces from error messages', () => {
    const error = new Error('Some internal error');
    error.stack = 'Error: Some internal error\n    at Object.<anonymous> (/app/lib/foo.ts:10:5)';
    const result = sanitizeErrorForClient(error);
    expect(result).not.toContain('/app/lib/foo.ts');
    expect(result).not.toContain('at Object');
  });

  it('returns the message for known error codes', () => {
    const result = sanitizeErrorForClient(new Error('Rate limit'), 'RATE_LIMITED');
    expect(result).toContain('too quickly');
  });

  it('handles non-Error objects', () => {
    const result = sanitizeErrorForClient('string error');
    expect(result).toBe('Something went wrong. Please try again.');
  });

  it('handles null/undefined', () => {
    const result = sanitizeErrorForClient(null);
    expect(result).toBe('Something went wrong. Please try again.');
  });
});
