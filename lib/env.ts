/**
 * Centralized environment variable validation.
 * Required vars throw on missing. Optional vars return null.
 */

export function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is required');
  return key;
}

export function getPerplexityKey(): string | null {
  return process.env.PERPLEXITY_API_KEY || null;
}

export function getAnthropicKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || null;
}

export function getStripeProducts(): { entry: string; pro: string; business: string } {
  const entry = process.env.STRIPE_PRODUCT_ENTRY;
  const pro = process.env.STRIPE_PRODUCT_PRO;
  const business = process.env.STRIPE_PRODUCT_BUSINESS;

  if (!entry || !pro || !business) {
    throw new Error('STRIPE_PRODUCT_ENTRY, STRIPE_PRODUCT_PRO, and STRIPE_PRODUCT_BUSINESS are required');
  }

  return { entry, pro, business };
}

export function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}

export function isPerplexityEnabled(): boolean {
  return !!process.env.PERPLEXITY_API_KEY;
}

export function isClaudeEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
