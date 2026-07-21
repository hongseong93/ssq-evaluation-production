"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, UserRound } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { evaluationIsComplete, evaluationTotal, weightedCriterionScore } from "@/lib/evaluation-score";

type DivisionFilter = "all" | "template" | "original";

const statusLabel = (status: string, complete: boolean, hasScore: boolean) => {
  if (!hasScore) return "미평가";
  if (status === "submitted" && complete) return "최종 제출";
  if (complete) return "평가 완료";
  return "평가 중";
};

export default function ScoresByJudgePage() {
  const [data, setData] = useState<any>(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/overview", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "점수 정보를 불러오지 못했습니다.");
        setData(body);
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "점수 정보를 불러오지 못했습니다.");
      }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const judges = useMemo(() => data?.judges ?? [], [data]);
  const submissions = useMemo(() => data?.submissions ?? [], [data]);
  const assignments = useMemo(() => data?.assignments ?? [], [data]);
  const criteria = useMemo(() => data?.criteria ?? [], [data]);
  const evaluations = useMemo(() => data?.evaluations ?? [], [data]);

  useEffect(() => {
    if (!judges.length) return;
    if (!judges.some((judge: any) => judge.id === selectedJudgeId)) setSelectedJudgeId(judges[0].id);
  }, [judges, selectedJudgeId]);

  const selectedJudge = judges.find((judge: any) => judge.id === selectedJudgeId);
  const judgeRows = useMemo(() => submissions.map((submission: any) => {
    const assignment = assignments.find((item: any) => item.judge_id === selectedJudgeId && item.submission_id === submission.id);
    const evaluation = evaluations.find((item: any) => item.judge_id === selectedJudgeId && item.submission_id === submission.id);
    const entries = evaluation?.score_entries ?? [];
    const submissionCriteria = criteria
      .filter((criterion: any) => criterion.division === submission.division)
      .sort((a: any, b: any) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0));
    const hasScore = entries.some((entry: any) => (entry.questionScores ?? []).some((score: number) => Number(score) > 0));
    const complete = evaluationIsComplete(entries, submissionCriteria);
    const status = assignment?.status ?? "not_started";

    return {
      assignment,
      complete,
      entries,
      hasScore,
      status,
      statusText: statusLabel(status, complete, hasScore),
      submission,
      submissionCriteria,
      total: hasScore ? evaluationTotal(entries, submissionCriteria) : null,
    };
  }), [assignments, criteria, evaluations, selectedJudgeId, submissions]);

  const visibleRows = judgeRows.filter((row: any) => divisionFilter === "all" || row.submission.division === divisionFilter);
  const evaluatedCount = judgeRows.filter((row: any) => row.complete).length;
  const submittedCount = judgeRows.filter((row: any) => row.complete && row.status === "submitted").length;
  const totalCount = judgeRows.length;

  return (
    <AdminShell title="심사위원별 점수" eyebrow="Scores">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">심사위원을 선택하면 해당 심사위원의 작품별 평가 결과만 표시됩니다.</p>
        <Button className="gap-2" onClick={() => window.location.assign("/api/admin/scores/export")}><Download size={16} /> 전체 Excel 다운로드</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-navy-900"><UserRound size={18} /> 심사위원 선택</div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {judges.map((judge: any) => {
            const done = submissions.filter((submission: any) => {
              const evaluation = evaluations.find((item: any) => item.judge_id === judge.id && item.submission_id === submission.id);
              const submissionCriteria = criteria.filter((criterion: any) => criterion.division === submission.division);
              return evaluationIsComplete(evaluation?.score_entries ?? [], submissionCriteria);
            }).length;
            const active = judge.id === selectedJudgeId;
            return (
              <button
                type="button"
                key={judge.id}
                aria-pressed={active}
                onClick={() => { setSelectedJudgeId(judge.id); setDivisionFilter("all"); }}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-md border px-4 text-sm font-semibold transition ${active ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                <span>{judge.name}</span>
                <span className={active ? "text-navy-100" : "text-slate-400"}>{done}/{submissions.length}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedJudge && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-xs font-semibold text-slate-500">선택 심사위원</p><p className="mt-2 text-xl font-bold text-navy-900">{selectedJudge.name}</p></Card>
            <Card className="p-4"><p className="text-xs font-semibold text-slate-500">평가 완료</p><p className="mt-2 text-xl font-bold text-navy-900">{evaluatedCount} / {totalCount}</p></Card>
            <Card className="p-4"><p className="text-xs font-semibold text-slate-500">최종 제출</p><p className="mt-2 text-xl font-bold text-navy-900">{submittedCount} / {totalCount}</p></Card>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900">{selectedJudge.name} 심사위원 평가 결과</h2>
            <div className="inline-flex rounded-md border border-slate-300 bg-white p-1">
              {([['all', '전체'], ['template', 'Template Creation'], ['original', 'Original Creation']] as const).map(([value, label]) => (
                <button type="button" key={value} aria-pressed={divisionFilter === value} onClick={() => setDivisionFilter(value)} className={`h-8 rounded px-3 text-xs font-semibold ${divisionFilter === value ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</button>
              ))}
            </div>
          </div>

          <Card className="mt-3 overflow-hidden">
            <DataTable
              headers={["접수번호", "부문", "작품명", "평가 항목별 점수", "총점", "상태"]}
              rows={visibleRows.map((row: any) => [
                row.submission.receipt_number,
                <Badge key="division">{row.submission.division === "original" ? "Original Creation" : "Template Creation"}</Badge>,
                row.submission.artwork_title,
                row.hasScore ? (
                  <div key="scores" className="grid min-w-[560px] grid-cols-5 divide-x divide-slate-200 rounded-md bg-slate-50 py-2">
                    {row.submissionCriteria.map((criterion: any) => {
                      const entry = row.entries.find((item: any) => item.criterionId === criterion.id);
                      return <div key={criterion.id} className="px-3"><p className="text-xs leading-5 text-slate-500">{criterion.title}</p><p className="mt-1 font-bold text-navy-900">{entry ? weightedCriterionScore(entry, criterion) : "-"}</p></div>;
                    })}
                  </div>
                ) : <span key="scores-empty" className="text-slate-400">평가 전</span>,
                row.total ?? "-",
                <Badge key="status" tone={row.statusText === "최종 제출" ? "green" : row.statusText === "평가 완료" ? "blue" : row.statusText === "평가 중" ? "gold" : "gray"}>{row.statusText}</Badge>,
              ])}
            />
            {!visibleRows.length && <p className="px-5 py-10 text-center text-sm text-slate-500">해당 부문의 출품작이 없습니다.</p>}
          </Card>
        </>
      )}

      {!selectedJudge && <Card className="mt-5 p-10 text-center text-sm text-slate-500">등록된 심사위원이 없습니다.</Card>}
      {message && <p className="mt-4 text-sm font-medium text-red-600">{message}</p>}
    </AdminShell>
  );
}
