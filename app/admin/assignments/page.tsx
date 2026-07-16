"use client";

import { useEffect, useState } from "react";
import { Link2, Shuffle } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";

const label = (status: string) => status === "submitted" ? "최종 제출" : status === "completed" ? "평가 완료" : status === "draft" ? "임시 저장" : "미평가";
export default function AssignmentsPage() {
  const [data, setData] = useState<any>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/admin/assignments", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); setData(d); }).catch(e => setMessage(e.message));
  useEffect(() => { void load(); }, []);
  const assign = async () => { setBusy(true); setMessage(""); try { const r = await fetch("/api/admin/assignments", { method: "POST" }); const d = await r.json(); if (!r.ok) throw new Error(d.message); setMessage(`${d.count}건의 배정 대상을 확인했습니다.`); await load(); } catch (e) { setMessage(e instanceof Error ? e.message : "배정에 실패했습니다."); } finally { setBusy(false); } };
  const judges = data?.judges ?? []; const submissions = data?.submissions ?? []; const assignments = data?.assignments ?? [];
  return <AdminShell title="작품 배정 관리"><div className="mb-5 flex flex-wrap gap-2"><Button className="gap-2" onClick={assign} disabled={busy}><Shuffle size={16}/> {busy ? "배정 중..." : "부문별 자동 배정"}</Button><Button variant="secondary" className="gap-2" onClick={assign} disabled={busy}><Link2 size={16}/> 전체 출품작 일괄 배정</Button></div><Card className="overflow-hidden"><DataTable headers={["심사위원", "접수번호", "작품명", "출품 부문", "상태", "마지막 변경"]} rows={assignments.map((assignment: any) => { const judge = judges.find((item: any) => item.id === assignment.judge_id); const submission = submissions.find((item: any) => item.id === assignment.submission_id); return [judge?.name ?? "-", submission?.receipt_number ?? "-", submission?.artwork_title ?? "-", <Badge key="division">{submission?.division === "original" ? "Original Creation" : "Template Creation"}</Badge>, <Badge key="status" tone={assignment.status === "submitted" ? "green" : assignment.status === "draft" ? "gold" : "gray"}>{label(assignment.status)}</Badge>, assignment.updated_at ? new Date(assignment.updated_at).toLocaleString("ko-KR") : "-"]; })}/></Card>{message && <p className="mt-4 text-sm text-slate-600">{message}</p>}</AdminShell>;
}
