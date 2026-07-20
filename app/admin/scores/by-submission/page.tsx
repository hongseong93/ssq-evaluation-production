"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { evaluationTotal } from "@/lib/evaluation-score";

export default function ScoresBySubmissionPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = () => fetch("/api/admin/overview", { cache: "no-store" }).then((response) => response.json()).then(setData);
    void load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo(() => (data?.submissions ?? []).map((submission: any) => {
    const evaluations = (data?.evaluations ?? []).filter((item: any) =>
      item.submission_id === submission.id && (item.score_entries ?? []).some((entry: any) => (entry.questionScores ?? []).some((score: number) => Number(score) > 0)),
    );
    const totals = evaluations.map((evaluation: any) => evaluationTotal(evaluation.score_entries, data?.criteria ?? []));
    const submittedCount = evaluations.filter((evaluation: any) => evaluation.status === "submitted").length;
    const average = totals.length ? Math.round((totals.reduce((sum: number, value: number) => sum + value, 0) / totals.length) * 10) / 10 : null;
    return { submission, totals, average, submittedCount };
  }).sort((a: any, b: any) => (b.average ?? -1) - (a.average ?? -1)), [data]);

  return (
    <AdminShell title="출품작별 총점표" eyebrow="Scores">
      <div className="mb-5 flex justify-end"><Button className="gap-2" onClick={() => window.location.assign("/api/admin/scores/export")}><Download size={16} /> Excel 다운로드</Button></div>
      <Card className="overflow-hidden">
        <DataTable
          headers={["순위", "접수번호", "부문", "작가명", "작품명", "현재 평균", "최고점", "최저점", "심사위원 수", "상태"]}
          rows={rows.map((item: any, index: number) => [
            index + 1,
            item.submission.receipt_number,
            <Badge key="division">{item.submission.division === "original" ? "Original Creation" : "Template Creation"}</Badge>,
            item.submission.artist_name,
            item.submission.artwork_title,
            item.average ?? "-",
            item.totals.length ? Math.max(...item.totals) : "-",
            item.totals.length ? Math.min(...item.totals) : "-",
            item.totals.length,
            <Badge key="status" tone={item.submittedCount === item.totals.length && item.totals.length ? "green" : item.totals.length ? "gold" : "gray"}>
              {item.submittedCount === item.totals.length && item.totals.length ? "최종 제출" : item.totals.length ? "진행 중" : "미평가"}
            </Badge>,
          ])}
        />
      </Card>
    </AdminShell>
  );
}
