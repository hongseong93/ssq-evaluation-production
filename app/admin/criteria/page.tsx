import { GripVertical, Plus } from "lucide-react";
import { AdminShell, Badge, Button, Card, DataTable, Field, TextArea, TextInput } from "@/components/ui";
import { criteria, divisionLabels } from "@/lib/data";

export default function CriteriaPage() {
  return (
    <AdminShell title="평가 항목 관리">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <DataTable
            headers={["순서", "부문", "항목명", "배점", "세부 질문", "수정 정책"]}
            rows={criteria.map((criterion) => [
              <span key="order" className="inline-flex items-center gap-2"><GripVertical size={15} className="text-slate-400" /> {criterion.order}</span>,
              <Badge key="division">{divisionLabels[criterion.division]}</Badge>,
              criterion.title,
              `${criterion.maxScore}점`,
              `${criterion.questions.length}개`,
              <Badge key="policy" tone="gold">심사 시작 후 배점 잠금</Badge>
            ])}
          />
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-bold text-navy-900">항목 추가</h2>
          <div className="mt-5 space-y-4">
            <Field label="부문"><TextInput defaultValue="Template Creation" /></Field>
            <Field label="항목명"><TextInput /></Field>
            <Field label="배점"><TextInput type="number" /></Field>
            <Field label="설명"><TextArea /></Field>
            <Field label="세부 질문"><TextArea placeholder="한 줄에 하나씩 입력" /></Field>
            <Button className="w-full gap-2"><Plus size={16} /> 평가 항목 추가</Button>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

