import { describe, it, expect } from 'vitest';
import { RATE_LIMITS } from '../rate-limit';

describe('RATE_LIMITS config', () => {
  it('defines limits for all endpoint categories', () => {
    expect(RATE_LIMITS.generate).toBeDefined();
    expect(RATE_LIMITS.chat).toBeDefined();
    expect(RATE_LIMITS.publish).toBeDefined();
    expect(RATE_LIMITS.image).toBeDefined();
    expect(RATE_LIMITS.video).toBeDefined();
    expect(RATE_LIMITS.strategy).toBeDefined();
  });

  it('all limits have positive values', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      expect(config.limit).toBeGreaterThan(0);
      expect(config.windowMs).toBeGreaterThan(0);
    }
  });

  it('expensive operations have lower limits than cheap ones', () => {
    expect(RATE_LIMITS.video.limit).toBeLessThan(RATE_LIMITS.generate.limit);
    expect(RATE_LIMITS.image.limit).toBeLessThan(RATE_LIMITS.generate.limit);
  });
});
