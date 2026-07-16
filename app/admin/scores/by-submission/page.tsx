"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";

export default function ScoresBySubmissionPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/overview", { cache: "no-store" }).then(r => r.json()).then(setData); }, []);
  const rows = useMemo(() => (data?.submissions ?? []).map((submission: any) => { const evaluations = (data?.evaluations ?? []).filter((item: any) => item.submission_id === submission.id && item.status === "submitted"); const totals = evaluations.map((evaluation: any) => evaluation.score_entries.reduce((sum: number, entry: any) => sum + entry.questionScores.reduce((value: number, score: number) => value + Number(score || 0), 0), 0)); const average = totals.length ? Math.round((totals.reduce((sum: number, value: number) => sum + value, 0) / totals.length) * 10) / 10 : null; return { submission, totals, average }; }).sort((a: any, b: any) => (b.average ?? -1) - (a.average ?? -1)), [data]);
  return <AdminShell title="출품작별 총점표" eyebrow="Scores"><div className="mb-5 flex justify-end"><Button className="gap-2" onClick={() => window.location.assign("/api/admin/scores/export")}><Download size={16}/> Excel 다운로드</Button></div><Card className="overflow-hidden"><DataTable headers={["순위", "접수번호", "부문", "작가명", "작품명", "평균", "최고점", "최저점", "심사위원 수"]} rows={rows.map((item: any, index: number) => [index + 1, item.submission.receipt_number, <Badge key="division">{item.submission.division === "original" ? "Original Creation" : "Template Creation"}</Badge>, item.submission.artist_name, item.submission.artwork_title, item.average ?? "-", item.totals.length ? Math.max(...item.totals) : "-", item.totals.length ? Math.min(...item.totals) : "-", item.totals.length])}/></Card></AdminShell>;
}
