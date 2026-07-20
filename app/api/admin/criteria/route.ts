import { NextResponse } from "next/server";
import { createCriterion, listCriteria, parseCriterionPayload } from "@/lib/server/criteria-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({ criteria: await listCriteria() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "평가 항목을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const criterion = await createCriterion(parseCriterionPayload(body));
    return NextResponse.json({ criterion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "평가 항목을 추가하지 못했습니다." }, { status: 400 });
  }
}
