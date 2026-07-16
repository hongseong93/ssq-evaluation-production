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
    const file = form.get("video");
    const videoPath = String(form.get("videoPath") || "");
    if (!receiptNumber || !artistName || !artworkTitle) return NextResponse.json({ message: "Receipt number, artist, and title are required." }, { status: 400 });
    const item = { id: `s-${crypto.randomUUID()}`, receiptNumber, division, artistName, artworkTitle, videoTitle: artworkTitle, concept, description: concept, videoUrl: "", thumbnailUrl: "", createdAt: new Date().toISOString().slice(0, 10) };
    if (hasSupabaseConfig()) {
      if (videoPath) {
        item.videoUrl = getSupabaseAdmin().storage.from("submission-videos").getPublicUrl(videoPath).data.publicUrl;
      } else if (file instanceof File && file.size > 0) {
        const path = `${item.id}/${file.name}`;
        const upload = await getSupabaseAdmin().storage.from("submission-videos").upload(path, file, { upsert: false });
        if (upload.error) throw new Error(upload.error.message);
        item.videoUrl = getSupabaseAdmin().storage.from("submission-videos").getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await getSupabaseAdmin().from("competition_submissions").insert({ id: item.id, receipt_number: item.receiptNumber, division: item.division, artist_name: item.artistName, artwork_title: item.artworkTitle, video_title: item.videoTitle, concept: item.concept, description: item.description, video_url: item.videoUrl, thumbnail_url: item.thumbnailUrl, created_at: item.createdAt }).select("*").single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ submission: data }, { status: 201 });
    }
    local.set(item.id, item as typeof demoSubmissions[number]);
    return NextResponse.json({ submission: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to register submission." }, { status: 500 });
  }
}
