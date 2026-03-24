/**
 * Anthropic Claude API client for content quality review and AI-brain analysis.
 * Reviews generated content for engagement potential and suggests improvements.
 */

import Anthropic from '@anthropic-ai/sdk';

interface ContentReview {
  improvedContent: string;
  engagementScore: number;
  suggestions: string[];
  hookStrength: number;
  urgencyLevel: number;
  captionLength: 'too_short' | 'optimal' | 'too_long';
  ctaEffectiveness: number;
}

export async function reviewContent(
  content: string,
  platform: string,
  niche: string
): Promise<ContentReview | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are an elite social media engagement optimization expert. Your job is to review content and make it more engaging, viral, and platform-optimized. You understand the psychology of ${platform} users and the ${niche} niche deeply.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "improvedContent": "the improved version of the content",
  "engagementScore": 85,
  "hookStrength": 78,
  "urgencyLevel": 65,
  "captionLength": "optimal",
  "ctaEffectiveness": 72,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Scoring guide (all 1-100 except captionLength):
- engagementScore: overall viral potential
- hookStrength: how strong the first line grabs attention
- urgencyLevel: how much urgency/FOMO the content creates
- captionLength: "too_short" | "optimal" | "too_long" for the platform
- ctaEffectiveness: how compelling the call-to-action is
- suggestions: specific, actionable improvements (e.g. "Stronger hook: try a question", "Add urgency with a deadline", "Shorten caption by 30%")`,
      messages: [
        {
          role: 'user',
          content: `Review and improve this ${platform} post for the ${niche} niche. Make it more engaging while keeping the core message:

${content}`
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      improvedContent: parsed.improvedContent || content,
      engagementScore: Math.min(100, Math.max(1, parsed.engagementScore || 50)),
      hookStrength: Math.min(100, Math.max(1, parsed.hookStrength || 50)),
      urgencyLevel: Math.min(100, Math.max(1, parsed.urgencyLevel || 50)),
      captionLength: parsed.captionLength || 'optimal',
      ctaEffectiveness: Math.min(100, Math.max(1, parsed.ctaEffectiveness || 50)),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('Claude content review failed:', error);
    return null;
  }
}

/**
 * Analyze a post's performance and extract patterns for the AI-brain.
 */
export async function analyzePostPerformance(
  post: { content: string; platforms: string[] },
  metrics: { likes?: number; shares?: number; reach?: number; impressions?: number }
): Promise<{ patterns: Array<{ type: string; value: string; score: number }> } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are an AI that analyzes social media post performance to extract reusable patterns. Respond ONLY with valid JSON.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this post and its metrics. Extract reusable patterns (hooks, CTAs, formats, tones) that contributed to its performance.

Post: ${post.content}
Platforms: ${post.platforms?.join(', ')}
Metrics: Likes=${metrics.likes || 0}, Shares=${metrics.shares || 0}, Reach=${metrics.reach || 0}, Impressions=${metrics.impressions || 0}

Respond with JSON:
{
  "patterns": [
    { "type": "winning_hook" | "cta_pattern" | "format_preference" | "audience_reaction", "value": "description of the pattern", "score": 0.0-1.0 }
  ]
}`
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude post analysis failed:', error);
    return null;
  }
}
