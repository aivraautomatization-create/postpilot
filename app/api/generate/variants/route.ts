import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isSubscriptionActive } from "@/lib/plan-limits";

export async function POST(req: Request) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: userProfile } = await (admin as any)
        .from('profiles')
        .select('subscription_status, trial_ends_at, stripe_customer_id')
        .eq('id', user.id)
        .single();
      if (userProfile && !isSubscriptionActive(userProfile)) {
        return NextResponse.json({
          error: "Your trial has expired. Please upgrade to continue.",
          code: "SUBSCRIPTION_EXPIRED"
        }, { status: 403 });
      }
    }

    const { content, platform, niche } = await req.json();

    if (!content || !platform || !niche) {
      return NextResponse.json({ error: "content, platform, and niche are required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an elite social media copywriter. Generate 3 content variations for A/B testing. Each variant should use a different hook style and CTA approach while maintaining the core message.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
[
  { "label": "A", "content": "Full post text", "hook": "The hook used", "cta": "The CTA used" },
  { "label": "B", "content": "Full post text", "hook": "The hook used", "cta": "The CTA used" },
  { "label": "C", "content": "Full post text", "hook": "The hook used", "cta": "The CTA used" }
]

Hook styles to vary across variants:
- Curiosity/question hook
- Bold/contrarian statement
- Data/statistic hook

CTA styles to vary:
- Soft engagement (question to audience)
- Direct action (save/share/follow)
- Urgency/scarcity`,
      messages: [
        {
          role: 'user',
          content: `Generate 3 variants for the following post.

PLATFORM: ${platform}
NICHE: ${niche}
ORIGINAL CONTENT:
${content}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const variants = JSON.parse(cleaned);

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Variants generation error:", error);
    return NextResponse.json({ error: "Failed to generate variants" }, { status: 500 });
  }
}
