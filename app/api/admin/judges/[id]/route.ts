import { NextResponse } from "next/server";
import { updateJudge } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const judge = await updateJudge(id, body);

    if (!judge) {
      return NextResponse.json({ message: "심사위원을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ judge });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "심사위원 수정에 실패했습니다." },
      { status: 400 }
    );
  }
}
