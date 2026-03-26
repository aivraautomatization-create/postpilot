import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getTemplate, type BusinessNiche } from '@/lib/business-templates';

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { niche, companyName, location } = await req.json();
    const template = getTemplate(niche as BusinessNiche);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Server error' }, { status: 500 });

    const now = new Date();
    const posts = template.calendar.map(day => {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(now.getDate() + day.day - 1);

      const personalize = (text: string) =>
        text
          .replace(/\[company\]|\[hotel name\]|\[restaurant\]/gi, companyName || 'our business')
          .replace(/\[city\]|\[destination\]|\[location\]/gi, location || 'our area');

      const content = `${personalize(day.hook)}\n\n${personalize(day.cta)}`;

      return {
        user_id: user.id,
        content,
        platform: day.platform.toLowerCase(),
        status: 'draft',
        journey_stage: day.goal,
        scheduled_at: scheduledDate.toISOString(),
        metadata: { theme: day.theme, format: day.format, template_niche: niche },
      };
    });

    const { error } = await admin.from('posts').insert(posts);
    if (error) throw error;

    return NextResponse.json({ success: true, count: posts.length });
  } catch (error: any) {
    console.error('[business-calendar]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
