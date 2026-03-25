import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch all data in parallel
    const [usageResult, postsResult, accountsResult, weeklyResult] = await Promise.all([
      // Current month usage
      admin!.from('usage').select('*').eq('user_id', user.id).eq('period', period).single(),
      // All posts
      admin!.from('posts').select('id, status, platforms, published_at, created_at').eq('user_id', user.id),
      // Connected accounts
      admin!.from('social_accounts').select('provider').eq('user_id', user.id),
      // Posts from last 7 days
      admin!
        .from('posts')
        .select('published_at, platforms, status')
        .eq('user_id', user.id)
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ]);

    const allPosts = postsResult.data || [];
    const weeklyPosts = weeklyResult.data || [];
    const accounts = accountsResult.data || [];
    const usage = usageResult.data;

    // Stats
    const totalPosts = allPosts.length;
    const publishedPosts = allPosts.filter((p: any) => p.status === 'published').length;
    const successRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;
    const activePlatforms = new Set(accounts.map((a: any) => a.provider)).size;

    // Posts per day for last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayPosts = weeklyPosts.filter((p: any) => {
        const pDate = (p.published_at || p.created_at || '').split('T')[0];
        return pDate === dateStr;
      });
      dailyData.push({
        name: dayNames[date.getDay()],
        posts: dayPosts.length,
      });
    }

    // Posts per platform
    const platformCounts: Record<string, number> = {};
    for (const post of allPosts) {
      if (post.platforms) {
        for (const platform of post.platforms) {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        }
      }
    }
    const platformData = Object.entries(platformCounts).map(([name, count]) => ({
      name: name === 'twitter' ? 'X' : name.charAt(0).toUpperCase() + name.slice(1),
      posts: count,
    }));

    return NextResponse.json({
      stats: {
        postsThisMonth: usage?.posts_count || 0,
        totalPublished: publishedPosts,
        successRate,
        activePlatforms,
      },
      dailyData,
      platformData,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: "Failed to fetch analytics. Please try again." }, { status: 500 });
  }
}
