export const PLAN_LIMITS: Record<string, { posts: number; videos: number; name: string }> = {
  'tier-entry': { posts: 28, videos: 0, name: 'Entry' },
  'tier-pro': { posts: 50, videos: 5, name: 'Pro' },
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
