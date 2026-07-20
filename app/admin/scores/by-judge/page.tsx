"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { evaluationTotal, weightedCriterionScore } from "@/lib/evaluation-score";

export default function ScoresByJudgePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = () => fetch("/api/admin/overview", { cache: "no-store" }).then((response) => response.json()).then(setData);
    void load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const judges = data?.judges ?? [];
  const submissions = data?.submissions ?? [];
  const assignments = data?.assignments ?? [];
  const criteria = data?.criteria ?? [];
  const evaluations = data?.evaluations ?? [];

  const rows = assignments.map((assignment: any) => {
    const judge = judges.find((item: any) => item.id === assignment.judge_id);
    const submission = submissions.find((item: any) => item.id === assignment.submission_id);
    const evaluation = evaluations.find((item: any) => item.judge_id === assignment.judge_id && item.submission_id === assignment.submission_id);
    const entries = evaluation?.score_entries ?? [];
    const total = evaluationTotal(entries, criteria);
    const details = entries.map((entry: any) => {
      const criterion = criteria.find((item: any) => item.id === entry.criterionId);
      return `${criterion?.title ?? "평가항목"}: ${weightedCriterionScore(entry, criterion)}`;
    }).join(" / ");

    return [
      judge?.name ?? "-",
      submission?.receipt_number ?? "-",
      <Badge key="division">{submission?.division === "original" ? "Original Creation" : "Template Creation"}</Badge>,
      submission?.artwork_title ?? "-",
      details || "-",
      entries.length ? total : "-",
      <Badge key="status" tone={assignment.status === "submitted" ? "green" : assignment.status === "draft" ? "gold" : "gray"}>{assignment.status === "submitted" ? "최종 제출" : assignment.status === "draft" ? "임시 저장" : "미평가"}</Badge>,
    ];
  });

  return (
    <AdminShell title="심사위원별 점수" eyebrow="Scores">
      <div className="mb-5 flex justify-end"><Button className="gap-2" onClick={() => window.location.assign("/api/admin/scores/export")}><Download size={16} /> Excel 다운로드</Button></div>
      <Card className="overflow-hidden"><DataTable headers={["심사위원", "접수번호", "부문", "작품명", "항목별 점수", "총점", "상태"]} rows={rows} /></Card>
    </AdminShell>
  );
}
