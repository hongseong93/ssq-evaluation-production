export type EvaluationScoreEntry = {
  criterionId: string;
  questionScores: number[];
};

export type EvaluationCriterion = {
  id: string;
  max_score?: number;
  maxScore?: number;
  questions?: string[];
};

export function evaluationIsComplete(entries: EvaluationScoreEntry[], criteria: EvaluationCriterion[]) {
  if (!criteria.length) return false;

  return criteria.every((criterion) => {
    const entry = entries.find((item) => item.criterionId === criterion.id);
    const questionCount = criterion.questions?.length ?? 0;
    return questionCount > 0
      && Boolean(entry)
      && entry!.questionScores.length >= questionCount
      && entry!.questionScores.slice(0, questionCount).every((score) => Number(score) > 0);
  });
}

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
