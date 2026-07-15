import { assignments, criteria, judges, scores, submissions } from "./data";
import { AssignmentStatus, ScoreEntry, Submission } from "./types";

export function criterionScore(entry: ScoreEntry) {
  const criterion = criteria.find((item) => item.id === entry.criterionId);
  if (!criterion || entry.questionScores.length === 0) return 0;
  const average = entry.questionScores.reduce((sum, score) => sum + score, 0) / entry.questionScores.length;
  return Number(((average / 5) * criterion.maxScore).toFixed(1));
}

export function totalScore(judgeId: string, submissionId: string) {
  return scores
    .filter((score) => score.judgeId === judgeId && score.submissionId === submissionId)
    .reduce((sum, entry) => sum + criterionScore(entry), 0);
}

export function submissionSummary(submission: Submission) {
  const relatedAssignments = assignments.filter((item) => item.submissionId === submission.id);
  const totals = relatedAssignments
    .map((item) => totalScore(item.judgeId, item.submissionId))
    .filter((score) => score > 0);
  const average = totals.length ? totals.reduce((sum, score) => sum + score, 0) / totals.length : 0;
  const max = totals.length ? Math.max(...totals) : 0;
  const min = totals.length ? Math.min(...totals) : 0;
  const variance = totals.length ? totals.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / totals.length : 0;
  return {
    average: Number(average.toFixed(1)),
    max: Number(max.toFixed(1)),
    min: Number(min.toFixed(1)),
    deviation: Number(Math.sqrt(variance).toFixed(1)),
    reviewers: totals.length
  };
}

export function rankedSubmissions() {
  return [...submissions]
    .map((submission) => ({ ...submission, summary: submissionSummary(submission) }))
    .sort((a, b) => b.summary.average - a.summary.average)
    .map((submission, index) => ({ ...submission, rank: index + 1 }));
}

export function judgeProgress(judgeId: string) {
  const related = assignments.filter((item) => item.judgeId === judgeId);
  const count = (status: AssignmentStatus) => related.filter((item) => item.status === status).length;
  const done = count("completed") + count("submitted");
  return {
    assigned: related.length,
    completed: count("completed"),
    submitted: count("submitted"),
    draft: count("draft"),
    notStarted: count("not_started"),
    progress: related.length ? Math.round((done / related.length) * 100) : 0,
    isFinalSubmitted: related.length > 0 && related.every((item) => item.status === "submitted")
  };
}

export function dashboardStats() {
  const doneAssignments = assignments.filter((item) => item.status === "completed" || item.status === "submitted").length;
  return {
    totalSubmissions: submissions.length,
    templateCount: submissions.filter((item) => item.division === "template").length,
    originalCount: submissions.filter((item) => item.division === "original").length,
    judgeCount: judges.length,
    finalSubmittedJudges: judges.filter((judge) => judgeProgress(judge.id).isFinalSubmitted).length,
    completionRate: Math.round((doneAssignments / assignments.length) * 100)
  };
}

