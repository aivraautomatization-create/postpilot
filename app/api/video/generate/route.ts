import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    const { visualPrompt, aspectRatio, platform, duration } = await req.json();
    if (!visualPrompt || !aspectRatio || !platform) {
      return NextResponse.json({ error: 'visualPrompt, aspectRatio, and platform are required' }, { status: 400 });
    }

    // Map duration to durationSeconds (Veo max is 8s per clip)
    const durationSeconds = 8;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[video/generate] Gemini API key missing, returning mock response');
      return NextResponse.json({
        error: 'Gemini API key not configured',
        mock: true,
        mockVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      });
    }

    let operation: any;
    try {
      const ai = new GoogleGenAI({ apiKey });
      operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: visualPrompt,
        config: {
          numberOfVideos: 1,
          durationSeconds,
          enhancePrompt: true,
          aspectRatio: aspectRatio as '9:16' | '16:9' | '1:1',
        },
      });
    } catch (veoError: any) {
      console.error('[video/generate] Veo API error:', veoError);
      return NextResponse.json({
        error: veoError.message || 'Video generation API error',
        mock: true,
        mockVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      });
    }

    // Save operation to Supabase
    const admin = getSupabaseAdmin();
    if (admin) {
      await (admin as any).from('video_operations').insert({
        user_id: user.id,
        operation_name: operation.name,
        platform,
        prompt: visualPrompt,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ operationName: operation.name, status: 'pending' });
  } catch (error: any) {
    console.error('[video/generate] Error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      mock: true,
      mockVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    });
  }
}
