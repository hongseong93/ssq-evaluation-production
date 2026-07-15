import { NextResponse } from "next/server";
import { createJudge, listJudges } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ judges: await listJudges() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const judge = await createJudge(body);
    return NextResponse.json({ judge }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "심사위원 생성에 실패했습니다." },
      { status: 400 }
    );
  }
}
