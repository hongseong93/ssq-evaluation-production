import { Download } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable } from "@/components/ui";
import { divisionLabels } from "@/lib/data";
import { rankedSubmissions } from "@/lib/scoring";

export default function ScoresBySubmissionPage() {
  return (
    <AdminShell title="출품작별 총점표" eyebrow="Scores">
      <div className="mb-5 flex justify-end">
        <Button className="gap-2"><Download size={16} /> Excel 다운로드</Button>
      </div>
      <Card className="overflow-hidden">
        <DataTable
          headers={["순위", "접수번호", "부문", "작가명", "작품명", "평균", "최고점", "최저점", "표준편차", "심사위원 수"]}
          rows={rankedSubmissions().map((submission) => [
            submission.rank,
            submission.receiptNumber,
            <Badge key="division">{divisionLabels[submission.division]}</Badge>,
            submission.artistName,
            submission.artworkTitle,
            submission.summary.average || "-",
            submission.summary.max || "-",
            submission.summary.min || "-",
            submission.summary.deviation || "-",
            submission.summary.reviewers
          ])}
        />
      </Card>
    </AdminShell>
  );
}

