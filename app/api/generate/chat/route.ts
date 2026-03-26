import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGeminiKey } from "@/lib/env";
import { isSubscriptionActive } from "@/lib/plan-limits";
import { checkRateLimitAsync } from "@/lib/rate-limit-store";

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

    // Rate limit: 10 per minute per user
    const { allowed, retryAfter } = await checkRateLimitAsync(`chat:${user.id}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json({
        error: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    // Check subscription
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_status, trial_ends_at, stripe_customer_id')
      .eq('id', user.id)
      .single();
    if (profile && !isSubscriptionActive(profile)) {
      return NextResponse.json({
        error: "Your trial has expired. Please upgrade to continue.",
        code: "SUBSCRIPTION_EXPIRED"
      }, { status: 403 });
    }

    const { message, reset, sessionId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const currentSessionId = reset ? crypto.randomUUID() : (sessionId || crypto.randomUUID());

    // If reset, delete old messages for this user's current session
    if (reset && sessionId) {
      await admin
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);
    }

    // Load chat history from Supabase
    const { data: history } = await admin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    const ai = new GoogleGenAI({ apiKey });

    // Reconstruct conversation history for Gemini
    const contents = (history || []).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add the new user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents,
      config: {
        systemInstruction: "You are an expert social media strategist and assistant. Help the user plan content, write captions, analyze trends, and grow their audience. Be concise, actionable, and encouraging.",
      }
    });

    const responseText = response.text || "";

    // Save both messages to Supabase
    await admin
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          session_id: currentSessionId,
          role: 'user',
          content: message
        },
        {
          user_id: user.id,
          session_id: currentSessionId,
          role: 'model',
          content: responseText
        }
      ]);

    return NextResponse.json({
      content: responseText,
      sessionId: currentSessionId
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
