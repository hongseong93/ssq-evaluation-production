import { Link2, Shuffle } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { assignments, divisionLabels, judges, submissions } from "@/lib/data";

export default function AssignmentsPage() {
  return (
    <AdminShell title="작품 배정 관리">
      <div className="mb-5 flex flex-wrap gap-2">
        <Button className="gap-2"><Shuffle size={16} /> 부문별 자동 배정</Button>
        <Button variant="secondary" className="gap-2"><Link2 size={16} /> 전체 작품 일괄 배정</Button>
      </div>
      <Card className="overflow-hidden">
        <DataTable
          headers={["심사위원", "담당 부문", "접수번호", "작품명", "출품 부문", "상태", "마지막 저장"]}
          rows={assignments.map((assignment) => {
            const judge = judges.find((item) => item.id === assignment.judgeId);
            const submission = submissions.find((item) => item.id === assignment.submissionId);
            return [
              judge?.name ?? "-",
              <Badge key="judge-division">{divisionLabels[judge?.division ?? "all"]}</Badge>,
              submission?.receiptNumber ?? "-",
              submission?.artworkTitle ?? "-",
              <Badge key="sub-division">{divisionLabels[submission?.division ?? "template"]}</Badge>,
              <Badge key="status" tone={assignment.status === "submitted" ? "green" : assignment.status === "draft" ? "gold" : "gray"}>{statusLabel(assignment.status)}</Badge>,
              assignment.updatedAt
            ];
          })}
        />
      </Card>
    </AdminShell>
  );
}

function statusLabel(status: string) {
  if (status === "submitted") return "최종 제출";
  if (status === "completed") return "평가 완료";
  if (status === "draft") return "임시 저장";
  return "미평가";
}

