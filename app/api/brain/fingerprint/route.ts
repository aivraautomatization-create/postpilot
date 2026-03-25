import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TwitterApi } from "twitter-api-v2";
import axios from "axios";

/**
 * POST /api/brain/fingerprint
 *
 * Analyzes a user's existing social media posts during onboarding to build
 * an initial brand voice profile. This creates immediate personalization
 * instead of starting cold.
 *
 * Flow:
 * 1. Fetch recent posts from the connected platform via API
 * 2. Send posts to Claude for voice/pattern analysis
 * 3. Store extracted patterns in brand_memory table
 * 4. Return a human-readable fingerprint summary
 *
 * Psychology: Endowed Progress Effect — giving users a "head start" increases
 * completion rates by 34% (Nunes & Dreze, 2006). The fingerprint makes users
 * feel Puls already "knows" them.
 */
export async function POST(req: Request) {
  try {
    const { provider } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Missing provider" }, { status: 400 });
    }

    // Auth
    const supabaseAuth = await getSupabaseServer();
    if (!supabaseAuth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Fetch connected account
    const { data: account } = await (admin as any)
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    if (!account) {
      return NextResponse.json(
        { error: `No ${provider} account connected. Connect it first.` },
        { status: 404 }
      );
    }

    // Fetch recent posts from platform
    let posts: Array<{ text: string; metrics?: { likes?: number; shares?: number } }> = [];

    try {
      if (provider === "twitter") {
        const client = new TwitterApi(account.access_token);
        const timeline = await client.v2.userTimeline(account.provider_account_id, {
          max_results: 20,
          "tweet.fields": ["public_metrics", "created_at"],
          exclude: ["retweets", "replies"],
        });
        posts = (timeline.data?.data || []).map((tweet) => ({
          text: tweet.text,
          metrics: {
            likes: tweet.public_metrics?.like_count || 0,
            shares: tweet.public_metrics?.retweet_count || 0,
          },
        }));
      } else if (provider === "linkedin") {
        // LinkedIn UGC Posts API
        const personUrn = account.provider_account_id;
        const resp = await axios.get("https://api.linkedin.com/v2/ugcPosts", {
          params: {
            q: "authors",
            authors: `List(urn:li:person:${personUrn})`,
            count: 20,
          },
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        posts = (resp.data.elements || []).map((post: any) => {
          const text =
            post.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "";
          return { text, metrics: {} };
        });
      } else if (provider === "instagram") {
        // Instagram Graph API — user's media
        const igUserId = account.provider_account_id;
        const resp = await axios.get(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          params: {
            fields: "caption,like_count,comments_count,timestamp",
            limit: 20,
            access_token: account.access_token,
          },
        });
        posts = (resp.data.data || []).map((media: any) => ({
          text: media.caption || "",
          metrics: { likes: media.like_count || 0, shares: media.comments_count || 0 },
        }));
      } else if (provider === "facebook") {
        const pageId = account.provider_account_id;
        const resp = await axios.get(`https://graph.facebook.com/v21.0/${pageId}/posts`, {
          params: {
            fields: "message,reactions.summary(true),shares",
            limit: 20,
            access_token: account.access_token,
          },
        });
        posts = (resp.data.data || [])
          .filter((p: any) => p.message)
          .map((p: any) => ({
            text: p.message,
            metrics: {
              likes: p.reactions?.summary?.total_count || 0,
              shares: p.shares?.count || 0,
            },
          }));
      }
    } catch (fetchErr: any) {
      console.error(`[fingerprint] Failed to fetch ${provider} posts:`, fetchErr.message);
      return NextResponse.json(
        { error: `Could not fetch posts from ${provider}. The account may need reconnecting.` },
        { status: 502 }
      );
    }

    // Filter out empty posts
    posts = posts.filter((p) => p.text.trim().length > 10);

    if (posts.length === 0) {
      return NextResponse.json({
        fingerprint: null,
        message: "No posts found to analyze. Your AI Brain will learn as you publish.",
        patternsStored: 0,
      });
    }

    // Analyze with Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI analysis unavailable" }, { status: 500 });
    }

    const claude = new Anthropic({ apiKey });

    const message = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a brand voice analyst. Analyze the user's existing social media posts and extract their authentic writing patterns.

RESPOND ONLY with valid JSON in this exact format:
{
  "voiceSummary": "A 2-3 sentence description of their brand voice (tone, style, energy)",
  "topHooks": ["Their 3 most engaging opening patterns"],
  "writingTraits": ["5 distinct characteristics of how they write"],
  "ctaStyle": "How they typically close posts or drive action",
  "emojiUsage": "none" | "minimal" | "moderate" | "heavy",
  "avgPostLength": "short" | "medium" | "long",
  "patterns": [
    {
      "memory_type": "winning_hook" | "cta_pattern" | "format_preference" | "audience_reaction",
      "content": { "description": "what makes this pattern work", "example": "example from their posts" },
      "performance_score": 0.7
    }
  ]
}

Be specific to THIS person's actual voice. Don't generic-ify it.`,
      messages: [
        {
          role: "user",
          content: `Platform: ${provider}\nNumber of posts analyzed: ${posts.length}\n\nPOSTS:\n${posts
            .map(
              (p, i) =>
                `--- Post ${i + 1} ${p.metrics?.likes ? `(${p.metrics.likes} likes, ${p.metrics.shares || 0} shares)` : ""} ---\n${p.text}`
            )
            .join("\n\n")}`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    let analysis: any;

    try {
      analysis = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI analysis" }, { status: 500 });
    }

    // Store patterns in brand_memory
    const patterns = analysis.patterns || [];
    if (patterns.length > 0) {
      const rows = patterns.map((p: any) => ({
        user_id: user.id,
        memory_type: p.memory_type,
        content: p.content,
        performance_score: p.performance_score || 0.5,
      }));

      await (admin as any).from("brand_memory").insert(rows);
    }

    // Mark fingerprint as analyzed
    await (admin as any)
      .from("profiles")
      .update({ brand_fingerprint_analyzed_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      fingerprint: {
        voiceSummary: analysis.voiceSummary,
        topHooks: analysis.topHooks,
        writingTraits: analysis.writingTraits,
        ctaStyle: analysis.ctaStyle,
        emojiUsage: analysis.emojiUsage,
        avgPostLength: analysis.avgPostLength,
      },
      postsAnalyzed: posts.length,
      patternsStored: patterns.length,
    });
  } catch (error: any) {
    console.error("[fingerprint] Error:", error);
    return NextResponse.json({ error: "Failed to analyze brand voice" }, { status: 500 });
  }
}
