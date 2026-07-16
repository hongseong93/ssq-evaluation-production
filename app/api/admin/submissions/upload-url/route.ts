import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) return NextResponse.json({ message: "Supabase is not connected." }, { status: 500 });
    const { fileName } = await request.json();
    if (!fileName) return NextResponse.json({ message: "File name is required." }, { status: 400 });
    const path = `${crypto.randomUUID()}/${String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data, error } = await getSupabaseAdmin().storage.from("submission-videos").createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to prepare video upload." }, { status: 500 });
  }
}
