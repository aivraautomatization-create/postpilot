/**
 * Perplexity Sonar API client for real-time trend research.
 * Uses the Sonar model for web-grounded search results.
 */

export async function searchTrends(
  niche: string,
  platform: string
): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a social media trend analyst. Provide ONLY current, real-time trending data. Focus on specific hashtags, topics, content formats, and algorithm preferences. Be concise and actionable. No generic advice.'
          },
          {
            role: 'user',
            content: `What are the top trending topics, hashtags, and content formats RIGHT NOW on ${platform} for the ${niche} niche? Include:
1. Top 3-5 trending topics/hashtags relevant to this niche
2. Current algorithm preferences (what content types are being boosted)
3. Viral content patterns that are working this week
4. Best posting times based on current engagement data

Be specific with real examples and data points.`
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Perplexity trend search failed:', error);
    return null;
  }
}

export async function analyzeAlgorithm(platform: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a social media algorithm expert. Provide current, factual information about platform algorithms.'
          },
          {
            role: 'user',
            content: `What are ${platform}'s current algorithm preferences as of this week? What content types, formats, and engagement patterns is the algorithm prioritizing? Include any recent algorithm changes or updates.`
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Perplexity algorithm analysis failed:', error);
    return null;
  }
}
