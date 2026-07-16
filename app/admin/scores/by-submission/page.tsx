"use client";
import { Download } from "lucide-react";
import { AdminShell, Button, Card, DataTable } from "@/components/ui";
import { divisionLabels } from "@/lib/data";
import { rankedSubmissions } from "@/lib/scoring";

export default function ScoresBySubmissionPage() {
  return <AdminShell title="출품작별 총점표" eyebrow="Scores"><div className="mb-5 flex justify-end"><Button className="gap-2" onClick={() => window.location.assign("/api/admin/scores/export")}><Download size={16}/> Excel 다운로드</Button></div><Card className="overflow-hidden"><DataTable headers={["순위","접수번호","부문","작가명","작품명","평균","최고점","최저점","표준편차","심사위원 수"]} rows={rankedSubmissions().map((item)=>[item.rank,item.receiptNumber,divisionLabels[item.division],item.artistName,item.artworkTitle,item.summary.average||"-",item.summary.max||"-",item.summary.min||"-",item.summary.deviation||"-",item.summary.reviewers])}/></Card></AdminShell>;
}
