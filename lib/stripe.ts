import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  let key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is required');
  
  // Clean up the key in case it was pasted with a prefix
  key = key.replace(/^.*(sk_live_|sk_test_)/i, '$1').trim();
  
  stripeClient = new Stripe(key, { apiVersion: '2026-02-25.clover' as any });
  return stripeClient;
}
