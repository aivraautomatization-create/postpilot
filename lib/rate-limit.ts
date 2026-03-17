export const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  generate: { limit: 20, windowMs: 60000 },
  chat: { limit: 10, windowMs: 60000 },
  publish: { limit: 10, windowMs: 60000 },
  image: { limit: 5, windowMs: 60000 },
  video: { limit: 3, windowMs: 60000 },
  animate: { limit: 3, windowMs: 60000 },
  strategy: { limit: 5, windowMs: 60000 },
  analyze: { limit: 5, windowMs: 60000 },
  trends: { limit: 5, windowMs: 60000 },
  regenerate: { limit: 5, windowMs: 60000 },
  videoProxy: { limit: 20, windowMs: 60000 },
  welcome: { limit: 3, windowMs: 300000 },
};

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export function _getStoreSize(): number {
  return rateLimitStore.size;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
