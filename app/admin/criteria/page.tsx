"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { AdminShell, Button, Card, Field, TextArea, TextInput } from "@/components/ui";

type Criterion = {
  id: string;
  division: "template" | "original";
  title: string;
  max_score?: number;
  maxScore?: number;
  description: string;
  questions: string[];
  display_order?: number;
  order?: number;
};

type CriterionForm = {
  division: "template" | "original";
  title: string;
  maxScore: string;
  description: string;
  questions: string;
};

const emptyForm: CriterionForm = { division: "template", title: "", maxScore: "", description: "", questions: "" };

export default function CriteriaPage() {
  const [items, setItems] = useState<Criterion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/criteria", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "평가 항목을 불러오지 못했습니다.");
    setItems(body.criteria || []);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (item: Criterion) => {
    setEditingId(item.id);
    setForm({
      division: item.division,
      title: item.title,
      maxScore: String(item.max_score ?? item.maxScore ?? ""),
      description: item.description || "",
      questions: (item.questions || []).join("\n"),
    });
    setMessage("");
  };

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/criteria/${editingId}` : "/api/admin/criteria", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "요청을 처리하지 못했습니다.");
      setMessage(editingId ? "평가 항목이 수정되었습니다." : "평가 항목이 추가되었습니다.");
      resetForm();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청을 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Criterion) => {
    if (!window.confirm(`'${item.title}' 평가 항목을 삭제하시겠습니까?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/criteria/${item.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "평가 항목을 삭제하지 못했습니다.");
      if (editingId === item.id) resetForm();
      setMessage("평가 항목이 삭제되었습니다.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "평가 항목을 삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="평가 항목 관리">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[64px_150px_minmax(180px,1fr)_80px_96px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            <span>순서</span><span>부문</span><span>항목명</span><span>배점</span><span className="text-center">관리</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className={`grid grid-cols-[64px_150px_minmax(180px,1fr)_80px_96px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-0 ${editingId === item.id ? "bg-navy-50" : ""}`}>
              <span>{item.display_order ?? item.order}</span>
              <span>{item.division === "template" ? "Template Creation" : "Original Creation"}</span>
              <span className="font-medium text-navy-900">{item.title}</span>
              <span>{item.max_score ?? item.maxScore}점</span>
              <div className="flex justify-center gap-1">
                <button type="button" title="평가 항목 수정" aria-label={`${item.title} 수정`} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-navy-900" onClick={() => startEdit(item)}><Pencil size={17} /></button>
                <button type="button" title="평가 항목 삭제" aria-label={`${item.title} 삭제`} className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" disabled={busy} onClick={() => remove(item)}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900">{editingId ? "항목 수정" : "항목 추가"}</h2>
            {editingId && <button type="button" title="수정 취소" aria-label="수정 취소" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={resetForm}><X size={18} /></button>}
          </div>
          <div className="mt-5 space-y-4">
            <Field label="부문"><select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value as "template" | "original" })}><option value="template">Template Creation</option><option value="original">Original Creation</option></select></Field>
            <Field label="항목명"><TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="배점"><TextInput type="number" min="1" value={form.maxScore} onChange={(event) => setForm({ ...form, maxScore: event.target.value })} /></Field>
            <Field label="설명"><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <Field label="세부 질문"><TextArea placeholder="한 줄에 하나씩 입력" value={form.questions} onChange={(event) => setForm({ ...form, questions: event.target.value })} /></Field>
            <Button className="w-full gap-2" disabled={busy} onClick={save}>{editingId ? <Save size={16} /> : <Plus size={16} />}{busy ? "처리 중..." : editingId ? "변경사항 저장" : "평가 항목 추가"}</Button>
            {message && <p className="text-sm text-slate-600" role="status">{message}</p>}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
