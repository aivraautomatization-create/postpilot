import { z } from 'zod';

const SUPPORTED_PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'] as const;

export const generateSchema = z.object({
  topic: z.string().min(1).max(500),
  platform: z.enum(SUPPORTED_PLATFORMS),
  profile: z.record(z.string(), z.unknown()).optional(),
  strategy: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
});

export const publishSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.enum(SUPPORTED_PLATFORMS)).min(1),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  scheduledDate: z.string().datetime().optional(),
});

export const checkoutSchema = z.object({
  tierId: z.enum(['tier-entry', 'tier-pro', 'tier-business']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});
