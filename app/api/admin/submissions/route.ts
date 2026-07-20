import { NextResponse } from "next/server";
import { createSubmission, listSubmissions, parseSubmissionPayload } from "@/lib/server/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ submissions: await listSubmissions() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "출품작을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const submission = await createSubmission(parseSubmissionPayload(await request.formData()));
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "출품작을 등록하지 못했습니다." }, { status: 400 });
  }
}
