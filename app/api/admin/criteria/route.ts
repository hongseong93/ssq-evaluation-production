import { NextResponse } from "next/server";
import { criteria as demoCriteria } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const local = [...demoCriteria];

export async function GET() {
  if (!hasSupabaseConfig()) return NextResponse.json({ criteria: local });
  const { data, error } = await getSupabaseAdmin().from("competition_criteria").select("*").order("display_order");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ criteria: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const questions = String(body.questions || "").split("\n").map((value) => value.trim()).filter(Boolean);
    if (!body.title || !body.maxScore || questions.length === 0) return NextResponse.json({ message: "Title, score, and at least one question are required." }, { status: 400 });
    const item = { id: `c-${crypto.randomUUID()}`, division: body.division, title: body.title, maxScore: Number(body.maxScore), description: body.description || "", questions, order: local.filter((value) => value.division === body.division).length + 1 };
    if (hasSupabaseConfig()) {
      const { data, error } = await getSupabaseAdmin().from("competition_criteria").insert({ id: item.id, division: item.division, title: item.title, max_score: item.maxScore, description: item.description, questions: item.questions, display_order: item.order }).select("*").single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ criterion: data }, { status: 201 });
    }
    local.push(item);
    return NextResponse.json({ criterion: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to add criterion." }, { status: 500 });
  }
}
