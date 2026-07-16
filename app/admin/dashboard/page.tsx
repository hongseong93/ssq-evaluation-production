"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, FileVideo, Users } from "lucide-react";
import { AdminShell, Badge, Card, DataTable, ProgressBar } from "@/components/ui";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/admin/overview", { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message); setData(body); }).catch((error) => setMessage(error.message)); }, []);
  const submissions = data?.submissions ?? [];
  const judges = data?.judges ?? [];
  const assignments = data?.assignments ?? [];
  const completed = assignments.filter((item: any) => item.status === "submitted").length;
  const rate = assignments.length ? Math.round((completed / assignments.length) * 100) : 0;
  const cards = [["총 출품작", submissions.length, FileVideo], ["Template", submissions.filter((item: any) => item.division === "template").length, Activity], ["Original", submissions.filter((item: any) => item.division === "original").length, Activity], ["심사위원", judges.filter((item: any) => item.isActive).length, Users], ["완료율", `${rate}%`, CheckCircle2]] as const;
  return <AdminShell title="대시보드"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon]) => <Card key={label} className="p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><Icon className="text-navy-700" size={20}/></div><p className="mt-4 text-3xl font-bold text-navy-900">{value}</p></Card>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]"><Card className="p-5"><h2 className="text-lg font-bold text-navy-900">전체 평가 완료율</h2><div className="mt-5"><ProgressBar value={rate}/></div><p className="mt-3 text-sm text-slate-500">최종 제출 기준 {completed} / {assignments.length}건</p></Card><Card className="overflow-hidden"><DataTable headers={["접수번호", "부문", "작품명", "상태"]} rows={submissions.slice(0, 8).map((submission: any) => { const related = assignments.filter((item: any) => item.submission_id === submission.id); return [submission.receipt_number, <Badge key="division">{submission.division === "template" ? "Template Creation" : "Original Creation"}</Badge>, submission.artwork_title, `${related.filter((item: any) => item.status !== "not_started").length} / ${related.length}명 평가`]; })}/></Card></div>{message && <p className="mt-4 text-sm text-red-600">{message}</p>}</AdminShell>;
}
