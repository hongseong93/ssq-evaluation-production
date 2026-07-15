import { Plus, Search, Upload } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable, Field, TextArea, TextInput } from "@/components/ui";
import { divisionLabels, submissions } from "@/lib/data";
import { submissionSummary } from "@/lib/scoring";

export default function SubmissionsPage() {
  return (
    <AdminShell title="출품작 관리">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <TextInput className="pl-10" placeholder="작품명, 작가명 검색" />
            </div>
            <Button className="gap-2">
              <Plus size={16} /> 출품작 등록
            </Button>
          </div>
          <DataTable
            headers={["접수번호", "부문", "작가명", "작품명", "영상", "평균 점수", "등록일"]}
            rows={submissions.map((submission) => {
              const summary = submissionSummary(submission);
              return [
                submission.receiptNumber,
                <Badge key="division">{divisionLabels[submission.division]}</Badge>,
                submission.artistName,
                submission.artworkTitle,
                <Badge key="video" tone="green">업로드 완료</Badge>,
                summary.average || "-",
                submission.createdAt
              ];
            })}
          />
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-navy-900">빠른 등록</h2>
          <div className="mt-5 space-y-4">
            <Field label="접수번호"><TextInput placeholder="SSQ-T-000" /></Field>
            <Field label="지원 부문"><TextInput defaultValue="Template Creation" /></Field>
            <Field label="작가명"><TextInput /></Field>
            <Field label="작품명"><TextInput /></Field>
            <Field label="기획의도"><TextArea /></Field>
            <Button variant="secondary" className="w-full gap-2"><Upload size={16} /> 영상 파일 업로드</Button>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

