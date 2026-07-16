import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/server/admin-overview";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getAdminOverview());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load admin data." }, { status: 500 });
  }
}
