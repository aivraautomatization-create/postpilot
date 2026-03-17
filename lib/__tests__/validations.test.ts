import { describe, it, expect } from 'vitest';
import { generateSchema, publishSchema, checkoutSchema } from '../validations';

describe('generateSchema', () => {
  it('accepts valid input', () => {
    const result = generateSchema.safeParse({
      topic: 'AI trends',
      platform: 'twitter',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty topic', () => {
    const result = generateSchema.safeParse({
      topic: '',
      platform: 'twitter',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing platform', () => {
    const result = generateSchema.safeParse({
      topic: 'AI trends',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid platform', () => {
    const result = generateSchema.safeParse({
      topic: 'AI trends',
      platform: 'myspace',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional profile and strategy', () => {
    const result = generateSchema.safeParse({
      topic: 'AI trends',
      platform: 'linkedin',
      profile: { company: 'Acme' },
      strategy: 'viral',
    });
    expect(result.success).toBe(true);
  });

  it('rejects topic longer than 500 chars', () => {
    const result = generateSchema.safeParse({
      topic: 'x'.repeat(501),
      platform: 'twitter',
    });
    expect(result.success).toBe(false);
  });
});

describe('publishSchema', () => {
  it('accepts valid input', () => {
    const result = publishSchema.safeParse({
      content: 'Hello world!',
      platforms: ['twitter'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty platforms array', () => {
    const result = publishSchema.safeParse({
      content: 'Hello world!',
      platforms: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content', () => {
    const result = publishSchema.safeParse({
      platforms: ['twitter'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional imageUrl and videoUrl', () => {
    const result = publishSchema.safeParse({
      content: 'Check this out!',
      platforms: ['twitter', 'linkedin'],
      imageUrl: 'https://example.com/image.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL for imageUrl', () => {
    const result = publishSchema.safeParse({
      content: 'Hello',
      platforms: ['twitter'],
      imageUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid scheduledDate', () => {
    const result = publishSchema.safeParse({
      content: 'Scheduled post',
      platforms: ['twitter'],
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe('checkoutSchema', () => {
  it('accepts valid tierId', () => {
    const result = checkoutSchema.safeParse({
      tierId: 'tier-pro',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid tierId', () => {
    const result = checkoutSchema.safeParse({
      tierId: 'tier-free',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing tierId', () => {
    const result = checkoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
