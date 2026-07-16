import { scores as demoScores } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";
import type { AssignmentStatus, ScoreEntry } from "@/lib/types";

type EvaluationRecord = {
  judge_id: string;
  submission_id: string;
  score_entries: ScoreEntry[];
  status: AssignmentStatus;
};

const localRecords = new Map<string, EvaluationRecord>();
const keyFor = (judgeId: string, submissionId: string) => `${judgeId}:${submissionId}`;

export async function getEvaluation(judgeId: string, submissionId: string) {
  if (!hasSupabaseConfig()) {
    return localRecords.get(keyFor(judgeId, submissionId)) ?? {
      judge_id: judgeId,
      submission_id: submissionId,
      score_entries: demoScores.filter((score) => score.judgeId === judgeId && score.submissionId === submissionId),
      status: "not_started" as AssignmentStatus
    };
  }

  const { data, error } = await getSupabaseAdmin().from("evaluation_records").select("*").eq("judge_id", judgeId).eq("submission_id", submissionId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as EvaluationRecord | null;
}

export async function saveEvaluation(judgeId: string, submissionId: string, scoreEntries: ScoreEntry[], status: AssignmentStatus) {
  const record: EvaluationRecord = { judge_id: judgeId, submission_id: submissionId, score_entries: scoreEntries, status };
  if (!hasSupabaseConfig()) {
    localRecords.set(keyFor(judgeId, submissionId), record);
    return record;
  }

  const { data, error } = await getSupabaseAdmin().from("evaluation_records").upsert(record, { onConflict: "judge_id,submission_id" }).select("*").single();
  if (error) throw new Error(error.message);
  const { error: assignmentError } = await getSupabaseAdmin().from("judge_assignments").update({ status, updated_at: new Date().toISOString() }).eq("judge_id", judgeId).eq("submission_id", submissionId);
  if (assignmentError) throw new Error(assignmentError.message);
  return data as EvaluationRecord;
}
