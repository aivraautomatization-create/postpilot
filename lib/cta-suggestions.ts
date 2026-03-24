export const CTA_BANKS: Record<string, string[]> = {
  bookings: ["Book now →", "Reserve your spot", "Limited availability — DM us", "Tap the link to book", "Only X slots left this week"],
  followers: ["Follow for daily tips", "Tag a friend who needs this", "Save this for later", "Share with your network", "Drop a 🔥 if this helped"],
  leads: ["DM me 'INFO' for details", "Free guide in bio", "Comment 'YES' and I'll send it", "Link in bio → free resource", "Book a free 15-min call"],
  brand_awareness: ["Share your thoughts below", "What's your experience?", "Tag us in your story", "Join our community →", "Follow our journey"],
};

export type JourneyStage = 'awareness' | 'engagement' | 'conversion';

export const STAGE_CTA_MAP: Record<JourneyStage, string[]> = {
  awareness: CTA_BANKS.brand_awareness.concat(CTA_BANKS.followers),
  engagement: CTA_BANKS.followers,
  conversion: CTA_BANKS.bookings.concat(CTA_BANKS.leads),
};

export function getSuggestedCTAs(stage: JourneyStage, goals?: string[]): string[] {
  const stageCTAs = STAGE_CTA_MAP[stage] || [];
  if (!goals?.length) return stageCTAs.slice(0, 5);
  const goalCTAs = goals.flatMap(g => CTA_BANKS[g] || []);
  const merged = [...new Set([...goalCTAs, ...stageCTAs])];
  return merged.slice(0, 6);
}
