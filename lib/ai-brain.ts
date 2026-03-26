/**
 * AI Brain — learns from published posts and builds a persistent brand memory
 * that improves content generation over time.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandMemoryEntry {
  memory_type:
    | 'winning_hook'
    | 'cta_pattern'
    | 'audience_reaction'
    | 'posting_time'
    | 'format_preference';
  content: Record<string, unknown>;
  performance_score: number;
  source_post_id?: string;
}

export interface StrategyReport {
  bestHooks: string[];
  bestFormats: string[];
  bestPostingTimes: string[];
  recommendations: string[];
  overallScore: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// 1. extractPatterns
// ---------------------------------------------------------------------------

export async function extractPatterns(
  post: { content: string; platforms: string[]; status: string },
  metrics: {
    likes?: number;
    shares?: number;
    reach?: number;
    impressions?: number;
  }
): Promise<BrandMemoryEntry[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a social-media analytics engine. Given a post and its performance metrics, extract reusable patterns.

IMPORTANT: Respond ONLY with valid JSON — an array of objects, each with:
{
  "memory_type": "winning_hook" | "cta_pattern" | "audience_reaction" | "posting_time" | "format_preference",
  "content": { <relevant details> },
  "performance_score": <0-1 float>
}

Evaluate performance_score relative to typical social-media engagement. Include only patterns that are genuinely notable (score >= 0.5).`,
      messages: [
        {
          role: 'user',
          content: `POST:\n${post.content}\n\nPLATFORMS: ${post.platforms.join(', ')}\nSTATUS: ${post.status}\n\nMETRICS:\nLikes: ${metrics.likes ?? 'N/A'}\nShares: ${metrics.shares ?? 'N/A'}\nReach: ${metrics.reach ?? 'N/A'}\nImpressions: ${metrics.impressions ?? 'N/A'}`,
        },
      ],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed: BrandMemoryEntry[] = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[ai-brain] extractPatterns failed:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. buildBrainContext
// ---------------------------------------------------------------------------

export async function buildBrainContext(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return '';

  try {
    const { data: memories, error } = await supabase
      .from('brand_memory')
      .select('*')
      .eq('user_id', userId)
      .order('performance_score', { ascending: false });

    if (error || !memories || memories.length === 0) return '';

    const hooks = memories
      .filter((m: { memory_type: string }) => m.memory_type === 'winning_hook')
      .slice(0, 5);
    const ctas = memories
      .filter((m: { memory_type: string }) => m.memory_type === 'cta_pattern')
      .slice(0, 5);
    const formats = memories
      .filter(
        (m: { memory_type: string }) => m.memory_type === 'format_preference'
      )
      .slice(0, 5);
    const times = memories
      .filter((m: { memory_type: string }) => m.memory_type === 'posting_time')
      .slice(0, 5);
    const reactions = memories
      .filter(
        (m: { memory_type: string }) => m.memory_type === 'audience_reaction'
      )
      .slice(0, 5);

    const lines: string[] = ['BRAND MEMORY:'];

    if (hooks.length > 0) {
      const avgScore =
        hooks.reduce(
          (s: number, h: any) =>
            s + h.performance_score,
          0
        ) / hooks.length;
      const hookDescriptions = hooks
        .map(
          (h: any) =>
            (h.content as { description?: string }).description ??
            JSON.stringify(h.content)
        )
        .join('; ');
      lines.push(
        `Best hooks (avg score ${avgScore.toFixed(2)}): ${hookDescriptions}.`
      );
    }

    if (formats.length > 0) {
      const formatDescriptions = formats
        .map(
          (f: any) =>
            `${(f.content as { format?: string }).format ?? 'unknown'} (${f.performance_score.toFixed(2)})`
        )
        .join(', ');
      lines.push(`Top formats: ${formatDescriptions}.`);
    }

    if (times.length > 0) {
      const timeDescriptions = times
        .map(
          (t: any) =>
            (t.content as { time?: string }).time ?? JSON.stringify(t.content)
        )
        .join(', ');
      lines.push(`Best posting times: ${timeDescriptions}.`);
    }

    if (ctas.length > 0) {
      const ctaDescriptions = ctas
        .map(
          (c: any) =>
            `'${(c.content as { text?: string }).text ?? 'unknown'}' (${c.performance_score.toFixed(2)})`
        )
        .join(', ');
      lines.push(`Top CTAs: ${ctaDescriptions}.`);
    }

    if (reactions.length > 0) {
      const reactionDescriptions = reactions
        .map(
          (r: any) =>
            (r.content as { insight?: string }).insight ??
            JSON.stringify(r.content)
        )
        .join('; ');
      lines.push(`Audience insights: ${reactionDescriptions}.`);
    }

    return lines.join(' ');
  } catch (error) {
    console.error('[ai-brain] buildBrainContext failed:', error);
    return '';
  }
}

// ---------------------------------------------------------------------------
// 2b. getLatestStrategyContext — returns most recent strategy recommendations
//     as a plain string for injection into generation prompts.
// ---------------------------------------------------------------------------

export async function getLatestStrategyContext(
  userId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('strategy_reports')
      .select('report_data, generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (!data?.report_data) return null;

    const report = data.report_data as unknown as StrategyReport;
    if (!report.recommendations?.length) return null;

    const lines = [
      `Strategy recommendations (from ${new Date(data.generated_at).toLocaleDateString()}):`,
      ...report.recommendations.map((r) => `- ${r}`),
    ];

    if (report.bestHooks?.length) {
      lines.push(`Best hook styles: ${report.bestHooks.slice(0, 3).join(', ')}.`);
    }
    if (report.bestPostingTimes?.length) {
      lines.push(`Best times to post: ${report.bestPostingTimes.slice(0, 2).join(', ')}.`);
    }

    return lines.join('\n');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. generateStrategyReport
// ---------------------------------------------------------------------------

export async function generateStrategyReport(
  userId: string,
  periodDays: number
): Promise<StrategyReport | null> {
  const client = getClient();
  const supabase = getSupabaseAdmin();
  if (!client || !supabase) return null;

  try {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    const sinceISO = since.toISOString();

    const [memoriesResult, postsResult] = await Promise.all([
      supabase
        .from('brand_memory')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', sinceISO)
        .order('performance_score', { ascending: false }),
      supabase
        .from('posts')
        .select('*, post_metrics(*)')
        .eq('user_id', userId)
        .gte('created_at', sinceISO),
    ]);

    const memories = memoriesResult.data ?? [];
    const posts = postsResult.data ?? [];

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are a social-media strategist. Analyze the brand memory patterns and post performance data, then produce a strategy report.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "bestHooks": ["hook 1", "hook 2"],
  "bestFormats": ["format 1", "format 2"],
  "bestPostingTimes": ["Tue 9am", "Thu 2pm"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "overallScore": 75
}

overallScore is 1-100 representing overall content strategy health.`,
      messages: [
        {
          role: 'user',
          content: `PERIOD: last ${periodDays} days\n\nBRAND MEMORY ENTRIES (${memories.length}):\n${JSON.stringify(memories, null, 2)}\n\nPOSTS (${posts.length}):\n${JSON.stringify(posts, null, 2)}`,
        },
      ],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';
    const report: StrategyReport = JSON.parse(text);

    // Persist the report
    const periodStart = since.toISOString().split('T')[0];
    const periodEnd = new Date().toISOString().split('T')[0];

    await supabase.from('strategy_reports').insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      report_data: report as unknown as import('./database.types').Json,
    });

    return report;
  } catch (error) {
    console.error('[ai-brain] generateStrategyReport failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 4. learnFromPost
// ---------------------------------------------------------------------------

export async function learnFromPost(
  userId: string,
  postId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (postError || !post) {
      console.error('[ai-brain] learnFromPost: post not found', postError);
      return;
    }

    const { data: metrics } = await supabase
      .from('post_metrics')
      .select('*')
      .eq('post_id', postId)
      .single();

    const patterns = await extractPatterns(
      {
        content: post.content ?? '',
        platforms: post.platforms ?? [],
        status: post.status,
      },
      {
        likes: metrics?.likes ?? undefined,
        shares: metrics?.shares ?? undefined,
        reach: metrics?.reach ?? undefined,
        impressions: metrics?.impressions ?? undefined,
      }
    );

    if (patterns.length === 0) return;

    const rows = patterns.map((p) => ({
      user_id: userId,
      memory_type: p.memory_type,
      content: p.content,
      performance_score: p.performance_score,
      source_post_id: postId,
    }));

    const { error: insertError } = await supabase
      .from('brand_memory')
      .insert(rows);

    if (insertError) {
      console.error(
        '[ai-brain] learnFromPost: insert failed',
        insertError
      );
    }
  } catch (error) {
    console.error('[ai-brain] learnFromPost failed:', error);
  }
}
