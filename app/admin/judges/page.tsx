"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, KeyRound, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable, Field, TextInput } from "@/components/ui";
import { divisionLabels } from "@/lib/data";
import { formatKoreanDateTime } from "@/lib/date-time";
import { evaluationIsComplete, type EvaluationCriterion, type EvaluationScoreEntry } from "@/lib/evaluation-score";
import type { Division, Judge } from "@/lib/types";

type JudgeWithProgress = Judge & {
  assignedCount: number;
  completedCount: number;
};

type OverviewSubmission = {
  id: string;
  division: Division;
};

type OverviewCriterion = EvaluationCriterion & {
  division: Division;
};

type OverviewEvaluation = {
  judge_id: string;
  submission_id: string;
  score_entries: EvaluationScoreEntry[];
};

type JudgeForm = {
  name: string;
  email: string;
  password: string;
  organization: string;
  position: string;
  phone: string;
  division: Judge["division"];
  isActive: boolean;
};

const emptyForm: JudgeForm = {
  name: "",
  email: "",
  password: "",
  organization: "",
  position: "",
  phone: "",
  division: "all",
  isActive: true
};

export default function JudgesPage() {
  const [judges, setJudges] = useState<JudgeWithProgress[]>([]);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JudgeForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedJudge = useMemo(() => judges.find((judge) => judge.id === editingId), [editingId, judges]);

  useEffect(() => {
    loadJudges();
  }, []);

  async function loadJudges() {
    setIsLoading(true);
    try {
      const [judgesResponse, overviewResponse] = await Promise.all([
        fetch("/api/admin/judges", { cache: "no-store" }),
        fetch("/api/admin/overview", { cache: "no-store" })
      ]);
      const [judgesResult, overviewResult] = await Promise.all([
        judgesResponse.json(),
        overviewResponse.json()
      ]);

      if (!judgesResponse.ok || !overviewResponse.ok) {
        throw new Error("심사위원 진행 현황을 불러오지 못했습니다.");
      }

      const submissions = (overviewResult.submissions || []) as OverviewSubmission[];
      const criteria = (overviewResult.criteria || []) as OverviewCriterion[];
      const evaluations = (overviewResult.evaluations || []) as OverviewEvaluation[];
      const evaluationByJudgeAndSubmission = new Map(
        evaluations.map((evaluation) => [
          `${evaluation.judge_id}:${evaluation.submission_id}`,
          evaluation
        ])
      );

      setJudges((judgesResult.judges || []).map((judge: Judge) => {
        const completedCount = submissions.filter((submission) => {
          const evaluation = evaluationByJudgeAndSubmission.get(`${judge.id}:${submission.id}`);
          const submissionCriteria = criteria.filter((criterion) => criterion.division === submission.division);
          return evaluationIsComplete(evaluation?.score_entries || [], submissionCriteria);
        }).length;

        return {
          ...judge,
          assignedCount: submissions.length,
          completedCount
        };
      }));
    } catch (error) {
      setJudges([]);
      setMessage(error instanceof Error ? error.message : "심사위원 진행 현황을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateForm<K extends keyof JudgeForm>(key: K, value: JudgeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(judge: Judge) {
    setMode("edit");
    setEditingId(judge.id);
    setMessage("");
    setForm({
      name: judge.name,
      email: judge.email,
      password: "",
      organization: judge.organization,
      position: judge.position,
      phone: judge.phone,
      division: judge.division,
      isActive: judge.isActive
    });
  }

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function saveJudge() {
    setMessage("");
    const url = mode === "edit" && editingId ? `/api/admin/judges/${editingId}` : "/api/admin/judges";
    const method = mode === "edit" ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "저장에 실패했습니다.");
      return;
    }

    setMessage(mode === "edit" ? "수정 내용이 DB에 저장되었습니다." : "새 심사위원이 DB에 저장되었습니다.");
    await loadJudges();
    if (mode === "create") setForm(emptyForm);
  }

  function resetPassword() {
    updateForm("password", "Temp@2026!");
  }

  async function removeJudge(judge: Judge) {
    const confirmed = window.confirm(`'${judge.name}' 심사위원을 삭제하시겠습니까?\n연결된 평가 기록도 함께 삭제됩니다.`);
    if (!confirmed) return;

    setDeletingId(judge.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/judges/${judge.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "심사위원 삭제에 실패했습니다.");
      if (editingId === judge.id) resetForm();
      await loadJudges();
      setMessage("심사위원 계정과 연결된 배정·평가 기록이 삭제되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "심사위원 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell title="심사위원 관리">
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-5 text-sm font-semibold text-slate-500">DB에서 심사위원 목록을 불러오는 중...</div>
          ) : (
            <DataTable
              headers={["이름", "이메일", "소속", "담당 부문", "배정", "완료", "상태", "마지막 접속", "관리"]}
              rows={judges.map((judge) => {
                return [
                  judge.name,
                  judge.email,
                  `${judge.organization} / ${judge.position}`,
                  <Badge key="division">{divisionLabels[judge.division]}</Badge>,
                  judge.assignedCount,
                  `${judge.completedCount} / ${judge.assignedCount}`,
                  <Badge key="active" tone={judge.isActive ? "green" : "gray"}>{judge.isActive ? "활성" : "비활성"}</Badge>,
                  formatKoreanDateTime(judge.lastSeen),
                  <div key="manage" className="flex items-center gap-1">
                    <button type="button" title="심사위원 수정" aria-label={`${judge.name} 수정`} className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-navy-900" onClick={() => startEdit(judge)}><Edit3 size={16} /></button>
                    <button type="button" title="심사위원 삭제" aria-label={`${judge.name} 삭제`} className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40" disabled={deletingId === judge.id} onClick={() => void removeJudge(judge)}><Trash2 size={16} /></button>
                  </div>
                ];
              })}
            />
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy-900">{mode === "edit" ? "계정 수정" : "계정 생성"}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {mode === "edit" && selectedJudge ? `${selectedJudge.name} 심사위원 정보 수정` : "신규 심사위원 계정 정보 입력"}
              </p>
            </div>
            {mode === "edit" ? (
              <Button variant="ghost" className="h-9 gap-2 px-3" onClick={resetForm}>
                <X size={15} /> 취소
              </Button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="이름">
              <TextInput value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            </Field>
            <Field label="이메일">
              <TextInput value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            </Field>
            <Field label={mode === "edit" ? "새 비밀번호" : "비밀번호"}>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <TextInput
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  placeholder={mode === "edit" ? "변경할 때만 입력" : "초기 비밀번호 입력"}
                />
                <Button type="button" variant="secondary" className="gap-2 px-3" onClick={resetPassword}>
                  <RotateCcw size={15} /> 생성
                </Button>
              </div>
            </Field>
            <Field label="소속">
              <TextInput value={form.organization} onChange={(event) => updateForm("organization", event.target.value)} />
            </Field>
            <Field label="직함">
              <TextInput value={form.position} onChange={(event) => updateForm("position", event.target.value)} />
            </Field>
            <Field label="연락처">
              <TextInput value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
            </Field>
            <Field label="담당 부문">
              <select
                value={form.division}
                onChange={(event) => updateForm("division", event.target.value as Judge["division"])}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-navy-500 focus:ring-2"
              >
                <option value="all">전체</option>
                <option value="template">Template Creation</option>
                <option value="original">Original Creation</option>
              </select>
            </Field>
            <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              계정 활성화
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} className="h-4 w-4 accent-navy-900" />
            </label>

            {message ? <p className="rounded-md bg-navy-50 px-3 py-2 text-sm font-semibold text-navy-700">{message}</p> : null}

            <Button className="w-full gap-2" onClick={saveJudge}>
              {mode === "edit" ? <Save size={16} /> : <Plus size={16} />}
              {mode === "edit" ? "수정 내용 저장" : "심사위원 생성"}
            </Button>
            <Button variant="secondary" className="w-full gap-2" onClick={resetPassword}>
              <KeyRound size={16} /> 비밀번호 초기화
            </Button>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
