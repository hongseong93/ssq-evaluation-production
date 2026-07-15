import { Download } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { assignments, criteria, divisionLabels, judges, scores, submissions } from "@/lib/data";
import { criterionScore, totalScore } from "@/lib/scoring";

export default function ScoresByJudgePage() {
  return (
    <AdminShell title="심사위원별 점수표" eyebrow="Scores">
      <div className="mb-5 flex justify-end">
        <Button className="gap-2"><Download size={16} /> Excel 다운로드</Button>
      </div>
      <Card className="overflow-hidden">
        <DataTable
          headers={["심사위원", "접수번호", "부문", "작품명", "항목별 점수", "총점", "메모", "상태"]}
          rows={assignments.map((assignment) => {
            const judge = judges.find((item) => item.id === assignment.judgeId);
            const submission = submissions.find((item) => item.id === assignment.submissionId);
            const entries = scores.filter((item) => item.judgeId === assignment.judgeId && item.submissionId === assignment.submissionId);
            const scoreText = entries
              .map((entry) => `${criteria.find((item) => item.id === entry.criterionId)?.title}: ${criterionScore(entry)}`)
              .join(" / ");
            return [
              judge?.name ?? "-",
              submission?.receiptNumber ?? "-",
              <Badge key="division">{divisionLabels[submission?.division ?? "template"]}</Badge>,
              submission?.artworkTitle ?? "-",
              scoreText || "-",
              totalScore(assignment.judgeId, assignment.submissionId) || "-",
              entries.find((entry) => entry.note)?.note || "-",
              <Badge key="status" tone={assignment.status === "submitted" ? "green" : assignment.status === "draft" ? "gold" : "gray"}>{statusLabel(assignment.status)}</Badge>
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

