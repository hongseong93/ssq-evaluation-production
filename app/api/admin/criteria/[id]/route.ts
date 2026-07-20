import { NextResponse } from "next/server";
import { deleteCriterion, parseCriterionPayload, updateCriterion } from "@/lib/server/criteria-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const criterion = await updateCriterion(id, parseCriterionPayload(await request.json()));
    if (!criterion) return NextResponse.json({ message: "평가 항목을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ criterion });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "평가 항목을 수정하지 못했습니다." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const deleted = await deleteCriterion(id);
    if (!deleted) return NextResponse.json({ message: "평가 항목을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "평가 항목을 삭제하지 못했습니다." }, { status: 400 });
  }
}
