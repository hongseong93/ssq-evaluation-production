"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import { assignments, criteria, divisionLabels, judges, scores, submissions } from "@/lib/data";
import { criterionScore } from "@/lib/scoring";
import { Badge, BrandMark, Button, Card, ProgressBar, TextArea } from "./ui";

const activeJudge = judges[0];
const assignedIds = assignments.filter((item) => item.judgeId === activeJudge.id).map((item) => item.submissionId);
const assignedSubmissions = submissions.filter((submission) => assignedIds.includes(submission.id));

export function JudgeEvaluation() {
  const [submissionIndex, setSubmissionIndex] = useState(0);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState(scores);
  const current = assignedSubmissions[submissionIndex];
  const currentCriteria = criteria.filter((item) => item.division === current.division).sort((a, b) => a.order - b.order);
  const activeCriterion = currentCriteria.find((item) => item.id === (activeCriterionId ?? currentCriteria[0]?.id)) ?? currentCriteria[0];
  const activeCriterionIndex = currentCriteria.findIndex((item) => item.id === activeCriterion.id);
  const progress = Math.round(((submissionIndex + 1) / assignedSubmissions.length) * 100);
  const assignment = assignments.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id);
  const activeEntry = localScores.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id && item.criterionId === activeCriterion.id);

  const total = useMemo(() => {
    return currentCriteria.reduce((sum, criterion) => {
      const entry = localScores.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id && item.criterionId === criterion.id);
      return sum + (entry ? criterionScore(entry) : 0);
    }, 0);
  }, [current.id, currentCriteria, localScores]);

  function updateQuestionScore(questionIndex: number, value: number) {
    let shouldAdvance = false;
    const nextCriterionId = currentCriteria[activeCriterionIndex + 1]?.id;

    setLocalScores((prev) => {
      const existing = prev.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id && item.criterionId === activeCriterion.id);
      const nextQuestionScores = activeCriterion.questions.map((_, index) => (index === questionIndex ? value : existing?.questionScores[index] || 0));
      shouldAdvance = Boolean(nextCriterionId) && nextQuestionScores.every((score) => score > 0);

      if (!existing) {
        return [
          ...prev,
          {
            judgeId: activeJudge.id,
            submissionId: current.id,
            criterionId: activeCriterion.id,
            questionScores: nextQuestionScores,
            note: ""
          }
        ];
      }
      return prev.map((item) =>
        item === existing
          ? {
              ...item,
              questionScores: nextQuestionScores
            }
          : item
      );
    });

    if (shouldAdvance && nextCriterionId) {
      window.setTimeout(() => setActiveCriterionId(nextCriterionId), 450);
    }
  }

  function updateNote(note: string) {
    setLocalScores((prev) => {
      const existing = prev.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id && item.criterionId === activeCriterion.id);
      if (!existing) {
        return [...prev, { judgeId: activeJudge.id, submissionId: current.id, criterionId: activeCriterion.id, questionScores: activeCriterion.questions.map(() => 0), note }];
      }
      return prev.map((item) => (item === existing ? { ...item, note } : item));
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Badge>{divisionLabels[current.division]}</Badge>
            <span className="hidden text-sm font-semibold text-slate-600 sm:inline">심사위원 : {activeJudge.name}</span>
            <Button variant="secondary">로그아웃</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-5">
        <Card className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={assignment?.status === "submitted" ? "green" : assignment?.status === "draft" ? "gold" : "gray"}>{statusLabel(assignment?.status)}</Badge>
                <span className="text-sm font-semibold text-slate-500">{current.receiptNumber}</span>
              </div>
              <h2 className="mt-3 text-3xl font-bold text-navy-900">{current.artworkTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">작가명 {current.artistName} · 영상 제목 {current.videoTitle}</p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">{current.concept}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-navy-900">
                <span>진행 상황</span>
                <span>
                  {String(submissionIndex + 1).padStart(2, "0")} / {assignedSubmissions.length}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">현재 총점</p>
                  <p className="text-2xl font-bold text-navy-900">{total.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-slate-500">지원 부문</p>
                  <p className="font-semibold text-navy-900">{divisionLabels[current.division]}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(430px,0.95fr)_minmax(500px,1fr)]">
          <Card className="overflow-hidden lg:sticky lg:top-24 lg:self-start">
            <video className="aspect-video w-full bg-black object-cover" controls poster={current.thumbnailUrl} src={current.videoUrl} />
            <div className="space-y-3 p-5">
              <h3 className="text-lg font-bold text-navy-900">기획의도</h3>
              <p className="text-sm leading-6 text-slate-700">{current.description}</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="grid grid-cols-2 gap-2 2xl:grid-cols-5">
              {currentCriteria.map((criterion, index) => {
                const entry = localScores.find((item) => item.judgeId === activeJudge.id && item.submissionId === current.id && item.criterionId === criterion.id);
                const isComplete = Boolean(entry) && criterion.questions.every((_, questionIndex) => (entry?.questionScores[questionIndex] || 0) > 0);
                const isCurrent = criterion.id === activeCriterion.id;

                return (
                <div
                  key={criterion.id}
                  className={`flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-center text-[13px] font-semibold leading-5 ${
                    isCurrent ? "bg-navy-900 text-white" : isComplete ? "bg-emerald-50 text-emerald-700" : index < activeCriterionIndex ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {criterion.title}
                </div>
              )})}
            </div>

            <div className="mt-5 border-b border-slate-200 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-navy-900">{activeCriterion.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{activeCriterion.description}</p>
                </div>
                <Badge tone="gold">{activeCriterion.maxScore}점</Badge>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {activeCriterion.questions.map((question, questionIndex) => (
                <div key={question} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">{question}</p>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = activeEntry?.questionScores[questionIndex] === value;
                      return (
                        <button
                          key={value}
                          onClick={() => updateQuestionScore(questionIndex, value)}
                          className={`h-10 rounded-md border text-sm font-bold ${selected ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-navy-50"}`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>전혀 아니다</span>
                    <span>매우 그렇다</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">평가 메모</span>
                <span className="text-xs text-slate-400">{activeEntry?.note.length ?? 0} / 300</span>
              </div>
              <TextArea maxLength={300} value={activeEntry?.note ?? ""} onChange={(event) => updateNote(event.target.value)} placeholder="심사 의견을 입력하세요." />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <Button
                variant="secondary"
                className="gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activeCriterionIndex === 0}
                onClick={() => setActiveCriterionId(currentCriteria[activeCriterionIndex - 1]?.id)}
              >
                <ArrowLeft size={16} /> 이전 평가항목
              </Button>
              <div className="text-sm font-semibold text-slate-500">
                {activeCriterionIndex + 1} / {currentCriteria.length}
              </div>
              <Button
                variant="secondary"
                className="gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={activeCriterionIndex === currentCriteria.length - 1}
                onClick={() => setActiveCriterionId(currentCriteria[activeCriterionIndex + 1]?.id)}
              >
                다음 평가항목 <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto grid max-w-7xl items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <Button variant="secondary" className="justify-self-start gap-2" onClick={() => setSubmissionIndex(Math.max(0, submissionIndex - 1)) as never}>
              <ArrowLeft size={16} /> 이전 작품
            </Button>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" className="gap-2">
                <Save size={16} /> 임시 저장
              </Button>
              <Button className="gap-2">
                <Send size={16} /> 최종 제출
              </Button>
            </div>
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setSubmissionIndex(Math.min(assignedSubmissions.length - 1, submissionIndex + 1)) as never}>
                다음 작품 <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
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
