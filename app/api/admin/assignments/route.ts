import { NextResponse } from "next/server";

const removedResponse = () => NextResponse.json(
  { message: "작품 배정 기능은 더 이상 사용하지 않습니다. 모든 심사위원은 전체 출품작을 심사합니다." },
  { status: 410 },
);

export async function GET() {
  return removedResponse();
}

export async function POST() {
  return removedResponse();
}
