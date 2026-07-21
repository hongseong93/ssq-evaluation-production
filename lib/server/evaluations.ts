import { criteria as demoCriteria, scores as demoScores, submissions as demoSubmissions } from "@/lib/data";
import { evaluationIsComplete } from "@/lib/evaluation-score";
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

export async function saveEvaluation(
  judgeId: string,
  submissionId: string,
  scoreEntries: ScoreEntry[],
  status: AssignmentStatus,
  options: { reopen?: boolean } = {}
) {
  let resolvedStatus = status;
  if (status === "draft") {
    if (!hasSupabaseConfig()) {
      const submission = demoSubmissions.find((item) => item.id === submissionId);
      const criteria = demoCriteria.filter((item) => item.division === submission?.division);
      if (evaluationIsComplete(scoreEntries, criteria)) resolvedStatus = "completed";
    } else {
      const db = getSupabaseAdmin();
      const { data: submission, error: submissionError } = await db.from("competition_submissions").select("division").eq("id", submissionId).single();
      if (submissionError) throw new Error(submissionError.message);
      const { data: criteria, error: criteriaError } = await db.from("competition_criteria").select("id,questions").eq("division", submission.division);
      if (criteriaError) throw new Error(criteriaError.message);
      if (evaluationIsComplete(scoreEntries, criteria ?? [])) resolvedStatus = "completed";
    }
  }

  const record: EvaluationRecord = { judge_id: judgeId, submission_id: submissionId, score_entries: scoreEntries, status: resolvedStatus };
  if (!hasSupabaseConfig()) {
    const existing = localRecords.get(keyFor(judgeId, submissionId));
    if (existing?.status === "submitted" && resolvedStatus !== "submitted" && !options.reopen) return existing;
    localRecords.set(keyFor(judgeId, submissionId), record);
    return record;
  }

  const db = getSupabaseAdmin();
  if (resolvedStatus !== "submitted" && !options.reopen) {
    // Conditional updates make the submitted state monotonic even when an
    // in-flight autosave request finishes after the final-submit request.
    const { data: updated, error: updateError } = await db.from("evaluation_records")
      .update({ score_entries: scoreEntries, status: resolvedStatus })
      .eq("judge_id", judgeId)
      .eq("submission_id", submissionId)
      .neq("status", "submitted")
      .select("*")
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);

    if (updated) {
      const { error: assignmentError } = await db.from("judge_assignments")
        .update({ status: resolvedStatus, updated_at: new Date().toISOString() })
        .eq("judge_id", judgeId)
        .eq("submission_id", submissionId)
        .neq("status", "submitted");
      if (assignmentError) throw new Error(assignmentError.message);
      return updated as EvaluationRecord;
    }

    const { data: existing, error: findError } = await db.from("evaluation_records").select("*").eq("judge_id", judgeId).eq("submission_id", submissionId).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (existing?.status === "submitted") {
      await db.from("judge_assignments").update({ status: "submitted", updated_at: new Date().toISOString() }).eq("judge_id", judgeId).eq("submission_id", submissionId);
      return existing as EvaluationRecord;
    }

    const { data: inserted, error: insertError } = await db.from("evaluation_records").insert(record).select("*").single();
    if (insertError?.code === "23505") {
      const { data: racedRecord, error: raceError } = await db.from("evaluation_records").select("*").eq("judge_id", judgeId).eq("submission_id", submissionId).single();
      if (raceError) throw new Error(raceError.message);
      return racedRecord as EvaluationRecord;
    }
    if (insertError) throw new Error(insertError.message);
    const { error: assignmentError } = await db.from("judge_assignments").update({ status: resolvedStatus, updated_at: new Date().toISOString() }).eq("judge_id", judgeId).eq("submission_id", submissionId).neq("status", "submitted");
    if (assignmentError) throw new Error(assignmentError.message);
    return inserted as EvaluationRecord;
  }

  const { data, error } = await db.from("evaluation_records").upsert(record, { onConflict: "judge_id,submission_id" }).select("*").single();
  if (error) throw new Error(error.message);
  const { error: assignmentError } = await db.from("judge_assignments").update({ status: resolvedStatus, updated_at: new Date().toISOString() }).eq("judge_id", judgeId).eq("submission_id", submissionId);
  if (assignmentError) throw new Error(assignmentError.message);
  return data as EvaluationRecord;
}
