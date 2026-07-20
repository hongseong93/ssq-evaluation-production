import { NextResponse } from "next/server";
import { deleteSubmission, parseSubmissionPayload, updateSubmission } from "@/lib/server/submissions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const submission = await updateSubmission(id, parseSubmissionPayload(await request.formData()));
    if (!submission) return NextResponse.json({ message: "출품작을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "출품작을 수정하지 못했습니다." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const deleted = await deleteSubmission(id);
    if (!deleted) return NextResponse.json({ message: "출품작을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "출품작을 삭제하지 못했습니다." }, { status: 400 });
  }
}
