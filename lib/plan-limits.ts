export const PLAN_LIMITS: Record<string, { posts: number; videos: number; name: string }> = {
  'tier-entry': { posts: 28, videos: 0, name: 'Entry' },
  'tier-pro': { posts: 50, videos: 10, name: 'Pro' },
  'tier-business': { posts: 100, videos: 50, name: 'Business' },
};

export function getUsageLimit(tier: string | null | undefined): number {
  if (!tier || !PLAN_LIMITS[tier]) return PLAN_LIMITS['tier-entry'].posts;
  return PLAN_LIMITS[tier].posts;
}

export function getPlanName(tier: string | null | undefined): string {
  if (!tier || !PLAN_LIMITS[tier]) return 'Entry';
  return PLAN_LIMITS[tier].name;
}

export function isSubscriptionActive(profile: {
  plan_status?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
}): boolean {
  if (!profile) return false;

  // Support both column names (plan_status or subscription_status)
  const status = profile.plan_status || profile.subscription_status;
  const hasPaidSub = profile.stripe_subscription_id || profile.stripe_customer_id;

  // Active paid subscriber
  if (status === 'active' && hasPaidSub) {
    return true;
  }

  // In trial period
  if (status === 'trialing' || !hasPaidSub) {
    if (profile.trial_ends_at) {
      return new Date(profile.trial_ends_at) > new Date();
    }
    // No trial end date set — allow access (safe fallback for new users)
    return true;
  }

  return false;
}
