import { Activity, FileVideo, Users, CheckCircle2, type LucideIcon } from "lucide-react";
import { AdminShell, Badge, Card, DataTable, ProgressBar } from "@/components/ui";
import { assignments, divisionLabels, submissions } from "@/lib/data";
import { dashboardStats } from "@/lib/scoring";

export default function AdminDashboardPage() {
  const stats = dashboardStats();
  const cards: Array<[string, string | number, LucideIcon]> = [
    ["총 출품작", stats.totalSubmissions, FileVideo],
    ["Template", stats.templateCount, Activity],
    ["Original", stats.originalCount, Activity],
    ["심사위원", stats.judgeCount, Users],
    ["완료율", `${stats.completionRate}%`, CheckCircle2]
  ];

  return (
    <AdminShell title="대시보드">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, Icon]) => (
          <Card key={String(label)} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{String(label)}</p>
              <Icon className="text-navy-700" size={20} />
            </div>
            <p className="mt-4 text-3xl font-bold text-navy-900">{String(value)}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-navy-900">전체 평가 완료율</h2>
          <div className="mt-5">
            <ProgressBar value={stats.completionRate} />
          </div>
          <p className="mt-3 text-sm text-slate-500">최종 제출 심사위원 {stats.finalSubmittedJudges}명 기준</p>
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            headers={["접수번호", "부문", "작품명", "상태"]}
            rows={submissions.slice(0, 4).map((submission) => {
              const related = assignments.filter((item) => item.submissionId === submission.id);
              return [
                submission.receiptNumber,
                <Badge key="division">{divisionLabels[submission.division]}</Badge>,
                submission.artworkTitle,
                `${related.filter((item) => item.status !== "not_started").length} / ${related.length}명 평가`
              ];
            })}
          />
        </Card>
      </div>
    </AdminShell>
  );
}
