import { criteria as demoCriteria } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export type CriterionPayload = {
  division: "template" | "original";
  title: string;
  maxScore: number;
  description: string;
  questions: string[];
};

type CriterionRow = {
  id: string;
  division: "template" | "original";
  title: string;
  max_score: number;
  description: string;
  questions: string[];
  display_order: number;
};

const local: CriterionRow[] = demoCriteria.map((item) => ({
  id: item.id,
  division: item.division,
  title: item.title,
  max_score: item.maxScore,
  description: item.description,
  questions: item.questions,
  display_order: item.order,
}));

function demoRows() {
  return local.map((item) => ({ ...item, questions: [...item.questions] }));
}

function sortCriteria(items: CriterionRow[]) {
  const divisionOrder = { template: 0, original: 1 };
  return [...items].sort((a, b) => divisionOrder[a.division] - divisionOrder[b.division] || a.display_order - b.display_order);
}

async function seedCriteriaIfEmpty() {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("competition_criteria").select("*").order("display_order");
  if (error) throw new Error(error.message);
  if (data?.length) return data as CriterionRow[];

  const { data: seeded, error: seedError } = await db
    .from("competition_criteria")
    .insert(demoRows())
    .select("*")
    .order("display_order");
  if (seedError) throw new Error(seedError.message);
  return (seeded ?? []) as CriterionRow[];
}

export async function listCriteria() {
  if (!hasSupabaseConfig()) return sortCriteria(demoRows());
  return sortCriteria(await seedCriteriaIfEmpty());
}

export async function createCriterion(payload: CriterionPayload) {
  const existing = await listCriteria();
  const row: CriterionRow = {
    id: `c-${crypto.randomUUID()}`,
    division: payload.division,
    title: payload.title,
    max_score: payload.maxScore,
    description: payload.description,
    questions: payload.questions,
    display_order: Math.max(0, ...existing.filter((item) => item.division === payload.division).map((item) => item.display_order)) + 1,
  };

  if (!hasSupabaseConfig()) {
    local.push(row);
    return row;
  }

  const { data, error } = await getSupabaseAdmin().from("competition_criteria").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return data as CriterionRow;
}

export async function updateCriterion(id: string, payload: CriterionPayload) {
  if (!hasSupabaseConfig()) {
    const index = local.findIndex((item) => item.id === id);
    if (index < 0) return null;
    local[index] = { ...local[index], ...payload, max_score: payload.maxScore };
    return local[index];
  }

  await seedCriteriaIfEmpty();
  const { data, error } = await getSupabaseAdmin()
    .from("competition_criteria")
    .update({
      division: payload.division,
      title: payload.title,
      max_score: payload.maxScore,
      description: payload.description,
      questions: payload.questions,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as CriterionRow | null;
}

export async function deleteCriterion(id: string) {
  if (!hasSupabaseConfig()) {
    const index = local.findIndex((item) => item.id === id);
    if (index < 0) return false;
    local.splice(index, 1);
    return true;
  }

  await seedCriteriaIfEmpty();
  const { data, error } = await getSupabaseAdmin().from("competition_criteria").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export function parseCriterionPayload(body: Record<string, unknown>): CriterionPayload {
  const division = body.division === "original" ? "original" : "template";
  const title = String(body.title ?? "").trim();
  const maxScore = Number(body.maxScore);
  const description = String(body.description ?? "").trim();
  const questions = Array.isArray(body.questions)
    ? body.questions.map(String).map((value) => value.trim()).filter(Boolean)
    : String(body.questions ?? "").split("\n").map((value) => value.trim()).filter(Boolean);

  if (!title || !Number.isFinite(maxScore) || maxScore <= 0 || questions.length === 0) {
    throw new Error("항목명, 1점 이상의 배점, 세부 질문을 입력해 주세요.");
  }

  return { division, title, maxScore, description, questions };
}
