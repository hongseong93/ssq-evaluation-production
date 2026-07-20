export type EvaluationScoreEntry = {
  criterionId: string;
  questionScores: number[];
};

export type EvaluationCriterion = {
  id: string;
  max_score?: number;
  maxScore?: number;
};

export function weightedCriterionScore(entry: EvaluationScoreEntry, criterion?: EvaluationCriterion) {
  if (!criterion || !entry.questionScores.length) return 0;
  const maxScore = Number(criterion.max_score ?? criterion.maxScore ?? 0);
  const average = entry.questionScores.reduce((sum, score) => sum + Number(score || 0), 0) / entry.questionScores.length;
  return Math.round(((average / 5) * maxScore) * 10) / 10;
}

export function evaluationTotal(entries: EvaluationScoreEntry[], criteria: EvaluationCriterion[]) {
  const total = entries.reduce(
    (sum, entry) => sum + weightedCriterionScore(entry, criteria.find((criterion) => criterion.id === entry.criterionId)),
    0,
  );
  return Math.round(total * 10) / 10;
}
