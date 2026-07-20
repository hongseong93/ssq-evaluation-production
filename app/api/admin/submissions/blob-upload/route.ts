import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { message: "Vercel Blob 저장소가 연결되지 않았습니다. 프로젝트 Storage에서 Blob을 연결해 주세요." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("submissions/")) {
          throw new Error("허용되지 않은 업로드 경로입니다.");
        }

        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"],
          maximumSizeInBytes: MAX_VIDEO_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: "submission-video" }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "영상 업로드를 준비하지 못했습니다." },
      { status: 400 },
    );
  }
}
