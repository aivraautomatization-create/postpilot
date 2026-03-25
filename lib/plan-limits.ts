export const PLAN_LIMITS: Record<string, { posts: number; videos: number; name: string }> = {
  'tier-entry': { posts: 15, videos: 0, name: 'Starter' },
  'tier-pro': { posts: 60, videos: 10, name: 'Creator' },
  'tier-business': { posts: 999, videos: 50, name: 'Pro' },
};

export function getUsageLimit(tier: string | null | undefined, bonusPosts: number = 0): number {
  const base = (!tier || !PLAN_LIMITS[tier]) ? PLAN_LIMITS['tier-entry'].posts : PLAN_LIMITS[tier].posts;
  return base + bonusPosts;
}

export function getPlanName(tier: string | null | undefined): string {
  if (!tier || !PLAN_LIMITS[tier]) return 'Starter';
  return PLAN_LIMITS[tier].name;
}

export function isSubscriptionActive(profile: {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  stripe_customer_id?: string | null;
}): boolean {
  if (!profile) return false;

  const status = profile.subscription_status;

  // Active subscriber (paid or admin/test accounts)
  if (status === 'active') {
    return true;
  }

  // In trial period — must have a valid trial_ends_at date
  if (status === 'trialing' && profile.trial_ends_at) {
    return new Date(profile.trial_ends_at) > new Date();
  }

  return false;
}
