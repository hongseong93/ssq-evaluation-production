"use client";

import { useEffect, useState } from "react";
import { AdminShell, Badge, Card, DataTable, ProgressBar } from "@/components/ui";

export default function ReviewStatusPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/overview", { cache: "no-store" }).then(r => r.json()).then(setData); }, []);
  const judges = data?.judges ?? []; const assignments = data?.assignments ?? [];
  return <AdminShell title="심사 현황"><Card className="overflow-hidden"><DataTable headers={["심사위원", "배정 작품", "평가 완료", "임시 저장", "미평가", "진행률", "최종 제출"]} rows={judges.map((judge: any) => { const rows = assignments.filter((item: any) => item.judge_id === judge.id); const submitted = rows.filter((item: any) => item.status === "submitted").length; const draft = rows.filter((item: any) => item.status === "draft").length; const done = rows.filter((item: any) => item.status === "completed" || item.status === "submitted").length; const rate = rows.length ? Math.round((done / rows.length) * 100) : 0; return [judge.name, rows.length, done, draft, rows.length - done - draft, <div key="progress" className="min-w-36"><ProgressBar value={rate}/><span className="mt-1 block text-xs text-slate-500">{rate}%</span></div>, <Badge key="final" tone={rows.length > 0 && submitted === rows.length ? "green" : "gray"}>{rows.length > 0 && submitted === rows.length ? "제출 완료" : "미제출"}</Badge>]; })}/></Card></AdminShell>;
}
