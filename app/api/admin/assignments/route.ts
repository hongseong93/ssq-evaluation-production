import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/server/admin-overview";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await getAdminOverview()); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load assignments." }, { status: 500 }); }
}

export async function POST() {
  try {
    if (!hasSupabaseConfig()) return NextResponse.json({ message: "Supabase database is not connected." }, { status: 500 });
    const overview = await getAdminOverview();
    const now = new Date().toISOString();
    const rows = overview.submissions.flatMap((submission) => overview.judges
      .filter((judge) => judge.isActive && (judge.division === "all" || judge.division === submission.division))
      .map((judge) => ({ judge_id: judge.id, submission_id: submission.id, status: "not_started", updated_at: now })));
    if (rows.length) {
      const { error } = await getSupabaseAdmin().from("judge_assignments").upsert(rows, { onConflict: "judge_id,submission_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ count: rows.length });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to assign submissions." }, { status: 500 });
  }
}
