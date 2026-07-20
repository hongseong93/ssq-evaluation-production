import { NextResponse } from "next/server";
import { assignments as demoAssignments, criteria as demoCriteria, judges as demoJudges, scores as demoScores, submissions as demoSubmissions } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const judgeId = new URL(request.url).searchParams.get("judgeId");
    if (!judgeId) return NextResponse.json({ message: "심사위원 정보가 필요합니다." }, { status: 400 });

    if (!hasSupabaseConfig()) {
      const judge = demoJudges.find((item) => item.id === judgeId);
      if (!judge) return NextResponse.json({ message: "심사위원을 찾을 수 없습니다." }, { status: 404 });
      const judgeAssignments = demoAssignments.filter((item) => item.judgeId === judgeId);
      const assignedIds = new Set(judgeAssignments.map((item) => item.submissionId));
      return NextResponse.json({
        judge,
        submissions: demoSubmissions.filter((item) => assignedIds.has(item.id)),
        criteria: demoCriteria,
        assignments: judgeAssignments,
        evaluations: judgeAssignments.map((assignment) => ({
          judge_id: judgeId,
          submission_id: assignment.submissionId,
          status: assignment.status,
          score_entries: demoScores.filter((score) => score.judgeId === judgeId && score.submissionId === assignment.submissionId),
        })),
      });
    }

    const db = getSupabaseAdmin();
    const [judgeResult, submissionsResult, criteriaResult, assignmentResult, evaluationResult] = await Promise.all([
      db.from("app_users").select("id,name,email,organization,position,phone,division,is_active,last_seen").eq("id", judgeId).eq("role", "judge").maybeSingle(),
      db.from("competition_submissions").select("*").order("created_at", { ascending: true }),
      db.from("competition_criteria").select("*").order("display_order", { ascending: true }),
      db.from("judge_assignments").select("*").eq("judge_id", judgeId),
      db.from("evaluation_records").select("*").eq("judge_id", judgeId),
    ]);

    for (const result of [judgeResult, submissionsResult, criteriaResult, assignmentResult, evaluationResult]) {
      if (result.error) throw new Error(result.error.message);
    }
    if (!judgeResult.data) return NextResponse.json({ message: "심사위원을 찾을 수 없습니다." }, { status: 404 });

    const judge = judgeResult.data;
    const eligibleSubmissions = (submissionsResult.data ?? []).filter((submission) => judge.division === "all" || judge.division === submission.division);
    const assignedIds = new Set((assignmentResult.data ?? []).map((assignment) => assignment.submission_id));
    const missingRows = eligibleSubmissions
      .filter((submission) => !assignedIds.has(submission.id))
      .map((submission) => ({ judge_id: judgeId, submission_id: submission.id, status: "not_started", updated_at: new Date().toISOString() }));

    if (missingRows.length) {
      const { error } = await db.from("judge_assignments").upsert(missingRows, { onConflict: "judge_id,submission_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }

    const { data: syncedAssignments, error: syncError } = await db.from("judge_assignments").select("*").eq("judge_id", judgeId);
    if (syncError) throw new Error(syncError.message);
    const syncedIds = new Set((syncedAssignments ?? []).map((assignment) => assignment.submission_id));

    return NextResponse.json({
      judge: {
        id: judge.id,
        name: judge.name,
        email: judge.email,
        organization: judge.organization,
        position: judge.position,
        phone: judge.phone,
        division: judge.division,
        isActive: judge.is_active,
        lastSeen: judge.last_seen,
      },
      submissions: eligibleSubmissions.filter((submission) => syncedIds.has(submission.id)),
      criteria: criteriaResult.data?.length ? criteriaResult.data : demoCriteria.map((item) => ({
        id: item.id,
        division: item.division,
        title: item.title,
        max_score: item.maxScore,
        description: item.description,
        questions: item.questions,
        display_order: item.order,
      })),
      assignments: syncedAssignments ?? [],
      evaluations: evaluationResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "심사 데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
