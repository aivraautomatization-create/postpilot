import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ operationName: string }> }
) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { operationName: rawOpName } = await params;
    const operationName = decodeURIComponent(rawOpName);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ done: false, error: 'Gemini API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    let result: any;
    try {
      result = await (ai.operations as any).getVideosOperation({ operation: { name: operationName } });
    } catch (error: any) {
      console.error('[video/status] Error polling operation:', error);
      return NextResponse.json({ done: false, error: error.message });
    }

    if (result.done) {
      const video = result.response?.generatedVideos?.[0]?.video;

      const admin = getSupabaseAdmin();
      if (admin) {
        await (admin as any)
          .from('video_operations')
          .update({
            status: 'completed',
            video_uri: video?.uri ?? null,
            completed_at: new Date().toISOString(),
          })
          .eq('operation_name', operationName);
      }

      return NextResponse.json({
        done: true,
        videoUri: video?.uri ?? null,
        videoBytes: video?.videoBytes ?? null,
      });
    }

    return NextResponse.json({ done: false, status: 'pending' });
  } catch (error: any) {
    console.error('[video/status] Unexpected error:', error);
    return NextResponse.json({ done: false, error: error.message });
  }
}
