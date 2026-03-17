/**
 * Anthropic Claude API client for content quality review.
 * Reviews generated content for engagement potential and suggests improvements.
 */

import Anthropic from '@anthropic-ai/sdk';

interface ContentReview {
  improvedContent: string;
  engagementScore: number;
  suggestions: string[];
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
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

The engagementScore should be 1-100 based on:
- Hook strength (first line impact)
- Emotional triggers
- Call-to-action effectiveness
- Platform-specific optimization
- Readability and rhythm
- Shareability potential`,
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
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('Claude content review failed:', error);
    return null;
  }
}
