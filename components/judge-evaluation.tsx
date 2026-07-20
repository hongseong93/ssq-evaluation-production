"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LogOut, Save, Send } from "lucide-react";
import type { AssignmentStatus, Criterion, Judge, ScoreEntry, Submission } from "@/lib/types";
import { Badge, BrandMark, Button, Card, ProgressBar, TextArea } from "./ui";

type AssignmentRow = { judge_id?: string; judgeId?: string; submission_id?: string; submissionId?: string; status: AssignmentStatus; updated_at?: string; updatedAt?: string };
type EvaluationRow = { score_entries?: ScoreEntry[]; scoreEntries?: ScoreEntry[] };
type WorkspaceResponse = {
  judge: Judge;
  submissions: Array<Record<string, unknown>>;
  criteria: Array<Record<string, unknown>>;
  assignments: AssignmentRow[];
  evaluations: EvaluationRow[];
  message?: string;
};

const divisionLabels = { template: "Template Creation", original: "Original Creation" } as const;

function normalizeSubmission(row: Record<string, unknown>): Submission {
  return {
    id: String(row.id),
    receiptNumber: String(row.receipt_number ?? row.receiptNumber ?? ""),
    division: (row.division === "original" ? "original" : "template"),
    artistName: String(row.artist_name ?? row.artistName ?? ""),
    artworkTitle: String(row.artwork_title ?? row.artworkTitle ?? ""),
    videoTitle: String(row.video_title ?? row.videoTitle ?? row.artwork_title ?? row.artworkTitle ?? ""),
    concept: String(row.concept ?? ""),
    description: String(row.description ?? row.concept ?? ""),
    videoUrl: String(row.video_url ?? row.videoUrl ?? ""),
    thumbnailUrl: String(row.thumbnail_url ?? row.thumbnailUrl ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
  };
}

function normalizeCriterion(row: Record<string, unknown>): Criterion {
  return {
    id: String(row.id),
    division: row.division === "original" ? "original" : "template",
    title: String(row.title ?? ""),
    maxScore: Number(row.max_score ?? row.maxScore ?? 0),
    description: String(row.description ?? ""),
    questions: Array.isArray(row.questions) ? row.questions.map(String) : [],
    order: Number(row.display_order ?? row.order ?? 0),
  };
}

function criterionScore(entry: ScoreEntry, criterion: Criterion) {
  if (!entry.questionScores.length) return 0;
  const average = entry.questionScores.reduce((sum, score) => sum + Number(score || 0), 0) / entry.questionScores.length;
  return Number(((average / 5) * criterion.maxScore).toFixed(1));
}

export function JudgeEvaluation() {
  const router = useRouter();
  const [judge, setJudge] = useState<Judge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [localScores, setLocalScores] = useState<ScoreEntry[]>([]);
  const [submissionIndex, setSubmissionIndex] = useState(0);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("review-system-user");
    const user = stored ? JSON.parse(stored) : null;
    if (!user || user.role !== "judge") {
      router.replace("/judge/login");
      return;
    }

    fetch(`/api/judge/workspace?judgeId=${encodeURIComponent(user.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as WorkspaceResponse;
        if (!response.ok) throw new Error(body.message || "심사 데이터를 불러오지 못했습니다.");
        setJudge(body.judge);
        setSubmissions(body.submissions.map(normalizeSubmission));
        setCriteria(body.criteria.map(normalizeCriterion));
        setAssignments(body.assignments ?? []);
        setLocalScores((body.evaluations ?? []).flatMap((evaluation) => evaluation.score_entries ?? evaluation.scoreEntries ?? []));
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "심사 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [router]);

  const current = submissions[submissionIndex];
  const currentCriteria = useMemo(
    () => criteria.filter((item) => item.division === current?.division).sort((a, b) => a.order - b.order),
    [criteria, current?.division],
  );
  const activeCriterion = currentCriteria.find((item) => item.id === activeCriterionId) ?? currentCriteria[0];
  const activeCriterionIndex = activeCriterion ? currentCriteria.findIndex((item) => item.id === activeCriterion.id) : 0;
  const assignment = assignments.find((item) => (item.submission_id ?? item.submissionId) === current?.id);
  const activeEntry = localScores.find((item) => item.judgeId === judge?.id && item.submissionId === current?.id && item.criterionId === activeCriterion?.id);
  const progress = submissions.length ? Math.round(((submissionIndex + 1) / submissions.length) * 100) : 0;

  const total = useMemo(() => {
    if (!current || !judge) return 0;
    return currentCriteria.reduce((sum, criterion) => {
      const entry = localScores.find((item) => item.judgeId === judge.id && item.submissionId === current.id && item.criterionId === criterion.id);
      return sum + (entry ? criterionScore(entry, criterion) : 0);
    }, 0);
  }, [current, currentCriteria, judge, localScores]);

  const isCurrentComplete = useMemo(() => {
    if (!current || !judge || currentCriteria.length === 0) return false;
    return currentCriteria.every((criterion) => {
      const entry = localScores.find((item) => item.judgeId === judge.id && item.submissionId === current.id && item.criterionId === criterion.id);
      return criterion.questions.length > 0 && criterion.questions.every((_, index) => Number(entry?.questionScores[index] || 0) > 0);
    });
  }, [current, currentCriteria, judge, localScores]);

  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    if (!judge || !current || loading || assignment?.status === "submitted") return;

    const scoreEntries = localScores.filter((item) => item.judgeId === judge.id && item.submissionId === current.id);
    const hasScore = scoreEntries.some((entry) => entry.questionScores.some((score) => Number(score) > 0));
    if (!hasScore) return;

    draftTimer.current = setTimeout(() => {
      fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgeId: judge.id, submissionId: current.id, scoreEntries, status: "draft" }),
      })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || "평가를 자동 저장하지 못했습니다.");
          const savedStatus = body.evaluation?.status ?? "draft";
          setAssignments((previous) => previous.map((item) => (item.submission_id ?? item.submissionId) === current.id ? { ...item, status: savedStatus } : item));
        })
        .catch((error) => setMessage(error instanceof Error ? error.message : "평가를 자동 저장하지 못했습니다."));
    }, 700);

    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [assignment?.status, current, judge, loading, localScores]);

  function updateQuestionScore(questionIndex: number, value: number) {
    if (!judge || !current || !activeCriterion || assignment?.status === "submitted") return;
    const nextCriterionId = currentCriteria[activeCriterionIndex + 1]?.id;
    let shouldAdvance = false;

    setLocalScores((previous) => {
      const existing = previous.find((item) => item.judgeId === judge.id && item.submissionId === current.id && item.criterionId === activeCriterion.id);
      const questionScores = activeCriterion.questions.map((_, index) => index === questionIndex ? value : existing?.questionScores[index] || 0);
      shouldAdvance = Boolean(nextCriterionId) && questionScores.every((score) => score > 0);
      if (!existing) return [...previous, { judgeId: judge.id, submissionId: current.id, criterionId: activeCriterion.id, questionScores, note: "" }];
      return previous.map((item) => item === existing ? { ...item, questionScores } : item);
    });

    if (shouldAdvance && nextCriterionId) window.setTimeout(() => setActiveCriterionId(nextCriterionId), 350);
  }

  function updateNote(note: string) {
    if (!judge || !current || !activeCriterion || assignment?.status === "submitted") return;
    setLocalScores((previous) => {
      const existing = previous.find((item) => item.judgeId === judge.id && item.submissionId === current.id && item.criterionId === activeCriterion.id);
      if (!existing) return [...previous, { judgeId: judge.id, submissionId: current.id, criterionId: activeCriterion.id, questionScores: activeCriterion.questions.map(() => 0), note }];
      return previous.map((item) => item === existing ? { ...item, note } : item);
    });
  }

  async function saveCurrentEvaluation(status: "draft" | "submitted") {
    if (!judge || !current) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    const scoreEntries = localScores.filter((item) => item.judgeId === judge.id && item.submissionId === current.id);
    const complete = currentCriteria.every((criterion) => {
      const entry = scoreEntries.find((item) => item.criterionId === criterion.id);
      return criterion.questions.every((_, index) => Number(entry?.questionScores[index] || 0) > 0);
    });
    if (status === "submitted" && !complete) {
      setMessage("모든 평가 문항에 점수를 입력한 뒤 최종 제출해 주세요.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgeId: judge.id, submissionId: current.id, scoreEntries, status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "평가를 저장하지 못했습니다.");
      const savedStatus = body.evaluation?.status ?? status;
      setAssignments((previous) => previous.map((item) => (item.submission_id ?? item.submissionId) === current.id ? { ...item, status: savedStatus } : item));
      setMessage(savedStatus === "submitted" ? "최종 제출되었습니다. 관리자 화면에 점수가 반영됩니다." : "임시 저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "평가를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function moveSubmission(nextIndex: number) {
    if (nextIndex > submissionIndex && !isCurrentComplete) {
      const incompleteCriterion = currentCriteria.find((criterion) => {
        const entry = localScores.find((item) => item.judgeId === judge?.id && item.submissionId === current?.id && item.criterionId === criterion.id);
        return criterion.questions.length === 0 || criterion.questions.some((_, index) => Number(entry?.questionScores[index] || 0) === 0);
      });
      if (incompleteCriterion) setActiveCriterionId(incompleteCriterion.id);
      setMessage("현재 작품의 5가지 평가항목을 모두 평가해야 다음 작품으로 이동할 수 있습니다.");
      return;
    }
    if (draftTimer.current) clearTimeout(draftTimer.current);
    if (judge && current && assignment?.status !== "submitted") {
      const scoreEntries = localScores.filter((item) => item.judgeId === judge.id && item.submissionId === current.id);
      if (scoreEntries.some((entry) => entry.questionScores.some((score) => Number(score) > 0))) {
        try {
          const response = await fetch("/api/evaluations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ judgeId: judge.id, submissionId: current.id, scoreEntries, status: isCurrentComplete ? "submitted" : "draft" }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || "평가를 저장하지 못했습니다.");
          const savedStatus = body.evaluation?.status ?? (isCurrentComplete ? "submitted" : "draft");
          setAssignments((previous) => previous.map((item) => (item.submission_id ?? item.submissionId) === current.id ? { ...item, status: savedStatus } : item));
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "평가를 저장하지 못했습니다.");
          return;
        }
      }
    }
    setSubmissionIndex(Math.max(0, Math.min(submissions.length - 1, nextIndex)));
    setActiveCriterionId(null);
    setMessage("");
  }

  function logout() {
    window.localStorage.removeItem("review-system-user");
    router.push("/judge/login");
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">심사 데이터를 불러오는 중입니다.</div>;

  if (!judge || !current) {
    return (
      <div className="min-h-screen bg-slate-100 p-5">
        <div className="mx-auto max-w-3xl"><BrandMark /><Card className="mt-6 p-8 text-center"><h1 className="text-xl font-bold text-navy-900">배정된 출품작이 없습니다.</h1><p className="mt-3 text-sm text-slate-600">{message || "관리자에게 작품 배정을 확인해 주세요."}</p></Card></div>
      </div>
    );
  }

  if (!activeCriterion) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-red-700">이 부문에 등록된 평가항목이 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-3"><Badge>{divisionLabels[current.division]}</Badge><span className="hidden text-sm font-semibold text-slate-600 sm:inline">심사위원: {judge.name}</span><Button variant="secondary" onClick={logout}><LogOut size={16} /> 로그아웃</Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-5">
        <Card className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div><div className="flex flex-wrap items-center gap-2"><Badge tone={assignment?.status === "submitted" ? "green" : assignment?.status === "draft" ? "gold" : "gray"}>{statusLabel(assignment?.status)}</Badge><span className="text-sm font-semibold text-slate-500">{current.receiptNumber}</span></div><h2 className="mt-3 text-3xl font-bold text-navy-900">{current.artworkTitle}</h2><p className="mt-2 text-sm text-slate-500">작가명 {current.artistName} · 영상 제목 {current.videoTitle}</p><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">{current.concept}</p></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between text-sm font-semibold text-navy-900"><span>진행 상황</span><span>{String(submissionIndex + 1).padStart(2, "0")} / {submissions.length}</span></div><div className="mt-3"><ProgressBar value={progress} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">현재 총점</p><p className="text-2xl font-bold text-navy-900">{total.toFixed(1)}</p></div><div><p className="text-slate-500">지원 부문</p><p className="font-semibold text-navy-900">{divisionLabels[current.division]}</p></div></div></div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(430px,0.95fr)_minmax(500px,1fr)]">
          <Card className="overflow-hidden lg:sticky lg:top-24 lg:self-start">
            {current.videoUrl ? <video className="aspect-video w-full bg-black object-contain" controls poster={current.thumbnailUrl || undefined} src={current.videoUrl} /> : <div className="grid aspect-video place-items-center bg-slate-900 text-sm font-semibold text-white">등록된 영상이 없습니다.</div>}
            <div className="space-y-3 p-5"><h3 className="text-lg font-bold text-navy-900">기획의도</h3><p className="text-sm leading-6 text-slate-700">{current.description || current.concept}</p></div>
          </Card>

          <Card className="p-5">
            <div className="grid grid-cols-2 gap-2 2xl:grid-cols-5">{currentCriteria.map((criterion) => { const entry = localScores.find((item) => item.judgeId === judge.id && item.submissionId === current.id && item.criterionId === criterion.id); const complete = Boolean(entry) && criterion.questions.every((_, index) => Number(entry?.questionScores[index] || 0) > 0); return <div key={criterion.id} className={`flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-center text-[13px] font-semibold leading-5 ${criterion.id === activeCriterion.id ? "bg-navy-900 text-white" : complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{criterion.title}</div>; })}</div>
            <div className="mt-5 border-b border-slate-200 pb-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-navy-900">{activeCriterion.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{activeCriterion.description}</p></div><Badge tone="gold">{activeCriterion.maxScore}점</Badge></div></div>
            <div className="mt-5 space-y-5">{activeCriterion.questions.map((question, questionIndex) => <div key={`${activeCriterion.id}-${questionIndex}`} className="rounded-lg border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">{question}</p><div className="mt-3 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} disabled={assignment?.status === "submitted"} onClick={() => updateQuestionScore(questionIndex, value)} className={`h-10 rounded-md border text-sm font-bold disabled:cursor-not-allowed ${activeEntry?.questionScores[questionIndex] === value ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-navy-50 disabled:hover:bg-white"}`}>{value}</button>)}</div><div className="mt-2 flex justify-between text-xs text-slate-400"><span>전혀 아니다</span><span>매우 그렇다</span></div></div>)}</div>
            <div className="mt-5"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">평가 메모</span><span className="text-xs text-slate-400">{activeEntry?.note.length ?? 0} / 300</span></div><TextArea disabled={assignment?.status === "submitted"} maxLength={300} value={activeEntry?.note ?? ""} onChange={(event) => updateNote(event.target.value)} placeholder="심사 의견을 입력하세요." /></div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-slate-200 pt-4"><Button variant="secondary" className="justify-self-start gap-2 disabled:opacity-40" disabled={activeCriterionIndex === 0} onClick={() => setActiveCriterionId(currentCriteria[activeCriterionIndex - 1]?.id)}><ArrowLeft size={16} /> 이전 평가항목</Button><div className="text-sm font-semibold text-slate-500">{activeCriterionIndex + 1} / {currentCriteria.length}</div><Button variant="secondary" className="justify-self-end gap-2 disabled:opacity-40" disabled={activeCriterionIndex === currentCriteria.length - 1} onClick={() => setActiveCriterionId(currentCriteria[activeCriterionIndex + 1]?.id)}>다음 평가항목 <ArrowRight size={16} /></Button></div>
          </Card>
        </div>

        {message && <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">{message}</p>}
        <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur"><div className="mx-auto grid max-w-7xl items-center gap-3 md:grid-cols-[1fr_auto_1fr]"><Button variant="secondary" className="justify-self-start gap-2" disabled={submissionIndex === 0} onClick={() => void moveSubmission(submissionIndex - 1)}><ArrowLeft size={16} /> 이전 작품</Button><div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" className="gap-2" disabled={saving || assignment?.status === "submitted"} onClick={() => void saveCurrentEvaluation("draft")}><Save size={16} /> 임시 저장</Button><Button className="gap-2" disabled={saving || assignment?.status === "submitted"} onClick={() => void saveCurrentEvaluation("submitted")}><Send size={16} /> {assignment?.status === "submitted" ? "제출 완료" : "최종 제출"}</Button></div><Button title={!isCurrentComplete ? "5가지 평가항목을 모두 완료해 주세요." : undefined} className="justify-self-end gap-2 disabled:cursor-not-allowed disabled:opacity-40" disabled={submissionIndex === submissions.length - 1 || !isCurrentComplete} onClick={() => void moveSubmission(submissionIndex + 1)}>다음 작품 <ArrowRight size={16} /></Button></div></div>
      </main>
    </div>
  );
}

function statusLabel(status?: string) {
  if (status === "submitted") return "최종 제출";
  if (status === "completed") return "평가 완료";
  if (status === "draft") return "임시 저장";
  return "미평가";
}
