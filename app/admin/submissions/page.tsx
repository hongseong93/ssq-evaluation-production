"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Plus, Upload } from "lucide-react";
import { AdminShell, Button, Card, Field, TextArea, TextInput } from "@/components/ui";

type Submission = {
  id: string;
  receipt_number?: string;
  receiptNumber?: string;
  artist_name?: string;
  artistName?: string;
  artwork_title?: string;
  artworkTitle?: string;
  video_url?: string;
  videoUrl?: string;
};

const emptyForm = {
  receiptNumber: "",
  division: "template",
  artistName: "",
  artworkTitle: "",
  concept: "",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function uploadVideo(file: File, receiptNumber: string, onProgress: (percentage: number) => void) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await upload(
        `submissions/${receiptNumber}/${crypto.randomUUID()}-${safeName}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/admin/submissions/blob-upload",
          multipart: file.size >= 100 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
        },
      );
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
  }

  throw lastError;
}

export default function SubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const response = await fetch("/api/admin/submissions", { cache: "no-store" });
    const data = await response.json();
    setItems(data.submissions || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.receiptNumber.trim() || !form.artistName.trim() || !form.artworkTitle.trim()) {
      setMessage("접수번호, 작가명, 작품명을 모두 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setUploadProgress(0);

    try {
      let videoUrl = "";
      if (video) {
        const blob = await uploadVideo(video, form.receiptNumber.trim(), setUploadProgress);
        videoUrl = blob.url;
      }

      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (videoUrl) body.append("videoUrl", videoUrl);

      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        body,
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({ message: "등록 요청을 처리하지 못했습니다." }));
      if (!response.ok) throw new Error(data.message);

      setMessage("출품작이 등록되었습니다.");
      setForm(emptyForm);
      setVideo(null);
      setUploadProgress(0);
      await load();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessage(`영상 업로드에 실패했습니다: ${detail}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell title="출품작 관리">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b p-4">
            <b>출품작 목록 ({items.length})</b>
            <Button onClick={save} disabled={isSaving}>
              <Plus size={16} /> 출품작 등록
            </Button>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-3 border-b p-4 text-sm">
              <span>{item.receipt_number ?? item.receiptNumber}</span>
              <span>{item.artist_name ?? item.artistName}</span>
              <span>{item.artwork_title ?? item.artworkTitle}</span>
              <span>{item.video_url ?? item.videoUrl ? "영상 업로드" : "영상 없음"}</span>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold">빠른 등록</h2>
          <div className="mt-5 space-y-4">
            <Field label="접수번호">
              <TextInput value={form.receiptNumber} onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })} />
            </Field>
            <Field label="지원 부문">
              <select className="h-10 w-full rounded-md border px-3" value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value })}>
                <option value="template">Template Creation</option>
                <option value="original">Original Creation</option>
              </select>
            </Field>
            <Field label="작가명">
              <TextInput value={form.artistName} onChange={(event) => setForm({ ...form, artistName: event.target.value })} />
            </Field>
            <Field label="작품명">
              <TextInput value={form.artworkTitle} onChange={(event) => setForm({ ...form, artworkTitle: event.target.value })} />
            </Field>
            <Field label="기획의도">
              <TextArea value={form.concept} onChange={(event) => setForm({ ...form, concept: event.target.value })} />
            </Field>

            <div>
              <input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(event) => setVideo(event.target.files?.[0] ?? null)} />
              {video && <p className="mt-2 text-xs text-slate-500">{video.name} · {formatFileSize(video.size)}</p>}
            </div>

            {isSaving && video && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded bg-slate-200">
                  <div className="h-full bg-blue-700 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-right text-xs text-slate-500">CDN 업로드 {uploadProgress}%</p>
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={save} disabled={isSaving}>
              <Upload size={16} /> {isSaving ? "등록 중..." : "영상 파일 업로드 및 등록"}
            </Button>
            {message && <p className="text-sm text-slate-700">{message}</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
