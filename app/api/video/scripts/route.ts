import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { content, sourceType, niche } = await req.json();
    if (!content || !sourceType) {
      return NextResponse.json({ error: 'content and sourceType are required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are a viral video content strategist. Take this ${sourceType} and transform it into 5 short-form video scripts, each optimized for a different platform.${niche ? ` The content is in the ${niche} niche.` : ''} Return ONLY valid JSON:
{
  "scripts": [
    {
      "platform": "Instagram Reels",
      "duration": 30,
      "hook": "The first 3 seconds (make it scroll-stopping)",
      "script": "Full narration/caption for the video",
      "visualPrompt": "Detailed visual description for AI video generation (describe scenes, style, mood, camera angles)",
      "aspectRatio": "9:16",
      "cta": "End call to action",
      "hashtags": ["tag1", "tag2", "tag3"]
    }
  ]
}
Platforms: Instagram Reels (30s, 9:16), TikTok (45s, 9:16), YouTube Shorts (60s, 9:16), LinkedIn Video (30s, 16:9), Twitter/X Video (30s, 1:1). Make hooks scroll-stopping. Visual prompts should be cinematic and specific.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Here is the ${sourceType} to transform into video scripts:\n\n${content}`,
        },
      ],
      system: systemPrompt,
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse scripts from AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ scripts: parsed.scripts });
  } catch (error: any) {
    console.error('[video/scripts] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
