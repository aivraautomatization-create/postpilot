import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await getSupabaseServer();

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { journeyStage } = body as { journeyStage: string };

    const validStages = ["awareness", "consideration", "conversion", "retention"];
    if (!journeyStage || !validStages.includes(journeyStage)) {
      return NextResponse.json(
        { error: "Invalid journeyStage. Must be one of: awareness, consideration, conversion, retention" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { error } = await admin
      .from("posts")
      .update({ journey_stage: journeyStage })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating journey stage:", error);
      return NextResponse.json({ error: "Failed to update journey stage" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Journey stage update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
