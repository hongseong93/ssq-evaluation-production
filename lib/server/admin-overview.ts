import { assignments as demoAssignments, criteria as demoCriteria, judges as demoJudges, submissions as demoSubmissions } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";
import { evaluationTotal } from "@/lib/evaluation-score";

type SubmissionRow = { id: string; receipt_number: string; division: "template" | "original"; artist_name: string; artwork_title: string; video_url: string; created_at: string };
type CriterionRow = { id: string; division: "template" | "original"; title: string; max_score: number; description: string; questions: string[]; display_order: number };
type AssignmentRow = { judge_id: string; submission_id: string; status: string; updated_at: string };
type EvaluationRow = { judge_id: string; submission_id: string; status: string; score_entries: Array<{ criterionId: string; questionScores: number[]; note: string }> };

export type AdminOverview = {
  submissions: SubmissionRow[];
  judges: typeof demoJudges;
  criteria: CriterionRow[];
  assignments: AssignmentRow[];
  evaluations: EvaluationRow[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!hasSupabaseConfig()) {
    return {
      submissions: demoSubmissions.map((item) => ({ id: item.id, receipt_number: item.receiptNumber, division: item.division, artist_name: item.artistName, artwork_title: item.artworkTitle, video_url: item.videoUrl, created_at: item.createdAt })),
      judges: demoJudges,
      criteria: demoCriteria.map((item) => ({ id: item.id, division: item.division, title: item.title, max_score: item.maxScore, description: item.description, questions: item.questions, display_order: item.order })),
      assignments: demoAssignments.map((item) => ({ judge_id: item.judgeId, submission_id: item.submissionId, status: item.status, updated_at: item.updatedAt })),
      evaluations: []
    };
  }

  const db = getSupabaseAdmin();
  const [submissions, judgeUsers, criteria, assignments, evaluations] = await Promise.all([
    db.from("competition_submissions").select("*").order("created_at", { ascending: false }),
    db.from("app_users").select("id,name,email,organization,position,phone,division,is_active,last_seen").eq("role", "judge"),
    db.from("competition_criteria").select("*").order("display_order"),
    db.from("judge_assignments").select("*"),
    db.from("evaluation_records").select("*")
  ]);
  for (const result of [submissions, judgeUsers, criteria, assignments, evaluations]) if (result.error) throw new Error(result.error.message);

  return {
    submissions: (submissions.data ?? []) as SubmissionRow[],
    judges: (judgeUsers.data ?? []).map((row) => ({ id: row.id, name: row.name, email: row.email, organization: row.organization, position: row.position, phone: row.phone, division: row.division, isActive: row.is_active, lastSeen: row.last_seen })),
    criteria: criteria.data?.length
      ? (criteria.data as CriterionRow[])
      : demoCriteria.map((item) => ({
          id: item.id,
          division: item.division,
          title: item.title,
          max_score: item.maxScore,
          description: item.description,
          questions: item.questions,
          display_order: item.order,
        })),
    assignments: (assignments.data ?? []) as AssignmentRow[],
    evaluations: (evaluations.data ?? []) as EvaluationRow[]
  };
}

export function scoreTotal(entries: EvaluationRow["score_entries"], criteria: CriterionRow[]) {
  return evaluationTotal(entries, criteria);
}
