import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await authenticateUser(body.email, body.password, body.role);

    if (!user) {
      return NextResponse.json(
        { message: "Email, password, or role is incorrect." },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { message: "Database connection failed. Check the Supabase values in Vercel." },
      { status: 500 }
    );
  }
}
