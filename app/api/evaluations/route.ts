import { NextResponse } from "next/server";
import { getEvaluation, saveEvaluation } from "@/lib/server/evaluations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const judgeId = url.searchParams.get("judgeId");
    const submissionId = url.searchParams.get("submissionId");
    if (!judgeId || !submissionId) return NextResponse.json({ message: "judgeId and submissionId are required." }, { status: 400 });
    return NextResponse.json({ evaluation: await getEvaluation(judgeId, submissionId) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load evaluation." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { judgeId, submissionId, scoreEntries, status, reopen } = await request.json();
    if (!judgeId || !submissionId || !Array.isArray(scoreEntries) || !["draft", "submitted"].includes(status)) {
      return NextResponse.json({ message: "Invalid evaluation payload." }, { status: 400 });
    }
    return NextResponse.json({ evaluation: await saveEvaluation(judgeId, submissionId, scoreEntries, status, { reopen: reopen === true }) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to save evaluation." }, { status: 500 });
  }
}
