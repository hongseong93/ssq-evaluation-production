import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await authenticateUser(body.email, body.password, body.role);

  if (!user) {
    return NextResponse.json(
      { message: "이메일, 비밀번호 또는 권한을 확인해 주세요." },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}
