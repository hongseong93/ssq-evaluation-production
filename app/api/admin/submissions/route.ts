import { NextResponse } from "next/server";
import { submissions as demoSubmissions } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const local = new Map(demoSubmissions.map((item) => [item.id, item]));

export async function GET() {
  if (!hasSupabaseConfig()) return NextResponse.json({ submissions: [...local.values()] });
  const { data, error } = await getSupabaseAdmin().from("competition_submissions").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data?.length ? data : demoSubmissions });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const receiptNumber = String(form.get("receiptNumber") || "").trim();
    const division = String(form.get("division") || "template");
    const artistName = String(form.get("artistName") || "").trim();
    const artworkTitle = String(form.get("artworkTitle") || "").trim();
    const concept = String(form.get("concept") || "").trim();
    const videoUrl = String(form.get("videoUrl") || "").trim();
    const videoPath = String(form.get("videoPath") || "");
    if (!receiptNumber || !artistName || !artworkTitle) return NextResponse.json({ message: "Receipt number, artist, and title are required." }, { status: 400 });
    const item = { id: `s-${crypto.randomUUID()}`, receiptNumber, division, artistName, artworkTitle, videoTitle: artworkTitle, concept, description: concept, videoUrl, thumbnailUrl: "", createdAt: new Date().toISOString().slice(0, 10) };
    if (hasSupabaseConfig()) {
      // Keep legacy Supabase Storage paths readable while all new videos use CDN URLs.
      if (!item.videoUrl && videoPath) {
        item.videoUrl = getSupabaseAdmin().storage.from("submission-videos").getPublicUrl(videoPath).data.publicUrl;
      }
      const { data, error } = await getSupabaseAdmin().from("competition_submissions").insert({ id: item.id, receipt_number: item.receiptNumber, division: item.division, artist_name: item.artistName, artwork_title: item.artworkTitle, video_title: item.videoTitle, concept: item.concept, description: item.description, video_url: item.videoUrl, thumbnail_url: item.thumbnailUrl, created_at: item.createdAt }).select("*").single();
      if (error) throw new Error(error.message);
      const { data: eligibleJudges, error: judgeError } = await getSupabaseAdmin()
        .from("app_users")
        .select("id,division")
        .eq("role", "judge")
        .eq("is_active", true);
      if (judgeError) throw new Error(judgeError.message);
      const assignmentRows = (eligibleJudges ?? [])
        .filter((judge) => judge.division === "all" || judge.division === item.division)
        .map((judge) => ({ judge_id: judge.id, submission_id: item.id, status: "not_started", updated_at: new Date().toISOString() }));
      if (assignmentRows.length) {
        const { error: assignmentError } = await getSupabaseAdmin().from("judge_assignments").upsert(assignmentRows, { onConflict: "judge_id,submission_id", ignoreDuplicates: true });
        if (assignmentError) throw new Error(assignmentError.message);
      }
      return NextResponse.json({ submission: data }, { status: 201 });
    }
    local.set(item.id, item as typeof demoSubmissions[number]);
    return NextResponse.json({ submission: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to register submission." }, { status: 500 });
  }
}
