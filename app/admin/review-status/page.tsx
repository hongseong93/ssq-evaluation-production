import { AdminShell, Badge, Card, DataTable, ProgressBar } from "@/components/ui";
import { judges } from "@/lib/data";
import { judgeProgress } from "@/lib/scoring";

export default function ReviewStatusPage() {
  return (
    <AdminShell title="심사 현황">
      <Card className="overflow-hidden">
        <DataTable
          headers={["심사위원", "배정 작품", "평가 완료", "임시 저장", "미평가", "진행률", "최종 제출"]}
          rows={judges.map((judge) => {
            const progress = judgeProgress(judge.id);
            return [
              judge.name,
              progress.assigned,
              progress.completed + progress.submitted,
              progress.draft,
              progress.notStarted,
              <div key="progress" className="min-w-36"><ProgressBar value={progress.progress} /><span className="mt-1 block text-xs text-slate-500">{progress.progress}%</span></div>,
              <Badge key="final" tone={progress.isFinalSubmitted ? "green" : "gray"}>{progress.isFinalSubmitted ? "제출 완료" : "미제출"}</Badge>
            ];
          })}
        />
      </Card>
    </AdminShell>
  );
}

