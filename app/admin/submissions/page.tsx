"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { AdminShell, Button, Card, Field, TextArea, TextInput } from "@/components/ui";

type Submission = {
  id: string;
  receipt_number: string;
  division: "template" | "original";
  artist_name: string;
  artwork_title: string;
  concept: string;
  video_url: string;
};

type SubmissionForm = {
  receiptNumber: string;
  division: "template" | "original";
  artistName: string;
  artworkTitle: string;
  concept: string;
};

const emptyForm: SubmissionForm = { receiptNumber: "", division: "template", artistName: "", artworkTitle: "", concept: "" };

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function uploadVideo(file: File, receiptNumber: string, onProgress: (percentage: number) => void) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await upload(`submissions/${receiptNumber}/${crypto.randomUUID()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/submissions/blob-upload",
        multipart: file.size >= 100 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
      });
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
  }
  throw lastError;
}

export default function SubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubmissionForm>(emptyForm);
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);

  const load = async () => {
    const response = await fetch("/api/admin/submissions", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "출품작을 불러오지 못했습니다.");
    setItems(data.submissions || []);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setVideo(null);
    setUploadProgress(0);
    setFileInputKey((value) => value + 1);
  };

  const startEdit = (item: Submission) => {
    setEditingId(item.id);
    setForm({ receiptNumber: item.receipt_number, division: item.division, artistName: item.artist_name, artworkTitle: item.artwork_title, concept: item.concept || "" });
    setVideo(null);
    setUploadProgress(0);
    setFileInputKey((value) => value + 1);
    setMessage("");
  };

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
      if (video) videoUrl = (await uploadVideo(video, form.receiptNumber.trim(), setUploadProgress)).url;
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (videoUrl) body.append("videoUrl", videoUrl);
      const response = await fetch(editingId ? `/api/admin/submissions/${editingId}` : "/api/admin/submissions", { method: editingId ? "PUT" : "POST", body, cache: "no-store" });
      const data = await response.json().catch(() => ({ message: "요청을 처리하지 못했습니다." }));
      if (!response.ok) throw new Error(data.message);
      setMessage(editingId ? "출품작이 수정되었습니다." : "출품작이 등록되었습니다.");
      resetForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청을 처리하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (item: Submission) => {
    if (!window.confirm(`'${item.artwork_title}' 출품작을 삭제하시겠습니까?\n연결된 배정과 평가 기록도 함께 삭제됩니다.`)) return;
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/submissions/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "출품작을 삭제하지 못했습니다.");
      if (editingId === item.id) resetForm();
      setMessage("출품작이 삭제되었습니다.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "출품작을 삭제하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const editingItem = items.find((item) => item.id === editingId);

  return (
    <AdminShell title="출품작 관리">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <b>출품작 목록 ({items.length})</b>
            <Button className="gap-2" onClick={resetForm}><Plus size={16} /> 출품작 등록</Button>
          </div>
          <div className="grid grid-cols-[minmax(130px,1fr)_minmax(120px,1fr)_minmax(160px,1.2fr)_100px_96px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            <span>접수번호</span><span>작가명</span><span>작품명</span><span>영상</span><span className="text-center">관리</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className={`grid grid-cols-[minmax(130px,1fr)_minmax(120px,1fr)_minmax(160px,1.2fr)_100px_96px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-0 ${editingId === item.id ? "bg-navy-50" : ""}`}>
              <span>{item.receipt_number}</span><span>{item.artist_name}</span><span className="font-medium text-navy-900">{item.artwork_title}</span><span>{item.video_url ? "업로드 완료" : "영상 없음"}</span>
              <div className="flex justify-center gap-1">
                <button type="button" title="출품작 수정" aria-label={`${item.artwork_title} 수정`} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-navy-900" onClick={() => startEdit(item)}><Pencil size={17} /></button>
                <button type="button" title="출품작 삭제" aria-label={`${item.artwork_title} 삭제`} className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" disabled={isSaving} onClick={() => remove(item)}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900">{editingId ? "출품작 수정" : "빠른 등록"}</h2>
            {editingId && <button type="button" title="수정 취소" aria-label="수정 취소" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={resetForm}><X size={18} /></button>}
          </div>
          <div className="mt-5 space-y-4">
            <Field label="접수번호"><TextInput value={form.receiptNumber} onChange={(event) => setForm({ ...form, receiptNumber: event.target.value })} /></Field>
            <Field label="지원 부문"><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value as SubmissionForm["division"] })}><option value="template">Template Creation</option><option value="original">Original Creation</option></select></Field>
            <Field label="작가명"><TextInput value={form.artistName} onChange={(event) => setForm({ ...form, artistName: event.target.value })} /></Field>
            <Field label="작품명"><TextInput value={form.artworkTitle} onChange={(event) => setForm({ ...form, artworkTitle: event.target.value })} /></Field>
            <Field label="기획의도"><TextArea value={form.concept} onChange={(event) => setForm({ ...form, concept: event.target.value })} /></Field>
            <div>
              <input key={fileInputKey} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(event) => setVideo(event.target.files?.[0] ?? null)} />
              {video ? <p className="mt-2 text-xs text-slate-500">{video.name} · {formatFileSize(video.size)}</p> : editingItem?.video_url ? <p className="mt-2 text-xs text-slate-500">새 파일을 선택하지 않으면 기존 영상을 유지합니다.</p> : null}
            </div>
            {isSaving && video && <div className="space-y-1"><div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-blue-700 transition-all" style={{ width: `${uploadProgress}%` }} /></div><p className="text-right text-xs text-slate-500">CDN 업로드 {uploadProgress}%</p></div>}
            <Button className="w-full gap-2" onClick={save} disabled={isSaving}>{editingId ? <Save size={16} /> : <Upload size={16} />}{isSaving ? "처리 중..." : editingId ? "변경사항 저장" : "영상 파일 업로드 및 등록"}</Button>
            {message && <p className="text-sm text-slate-700" role="status">{message}</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
