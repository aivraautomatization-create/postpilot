import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGeminiKey } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const { business, platform } = await req.json();

    if (!business || typeof business !== "string" || business.length > 200) {
      return NextResponse.json({ error: "Please describe your business (max 200 chars)." }, { status: 400 });
    }
    if (!platform || typeof platform !== "string") {
      return NextResponse.json({ error: "Please select a platform." }, { status: 400 });
    }

    // Rate limit by IP — 1 demo per IP per hour
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfter } = checkRateLimit(`demo:${ip}`, 3, 3600000);
    if (!allowed) {
      return NextResponse.json({
        error: `Demo limit reached. Sign up for unlimited generations! Try again in ${retryAfter} seconds.`,
        code: "RATE_LIMITED"
      }, { status: 429 });
    }

    let apiKey: string;
    try {
      apiKey = getGeminiKey();
    } catch {
      return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are Puls's content engine. Generate ONE short, compelling social media post for ${platform}.

RULES:
- Write for a business described as: "${business}"
- Sound human, NOT like AI. No "In a world where...", no emoji lists, no "Discover the secret of..."
- Use punchy, rhythmic writing. Vary sentence length.
- Keep it under 200 words
- Make it specific to ${platform}'s style
- Include a hook that stops the scroll
- End with a subtle call to action

OUTPUT: Just the post text. Nothing else. No labels, no "Here's your post:", no quotes.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a ${platform} post for this business: ${business}`,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    const content = response.text || "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Demo generation error:", error);
    return NextResponse.json({ error: "Failed to generate content." }, { status: 500 });
  }
}
