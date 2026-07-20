import { del } from "@vercel/blob";
import { submissions as demoSubmissions } from "@/lib/data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";

export type SubmissionPayload = {
  receiptNumber: string;
  division: "template" | "original";
  artistName: string;
  artworkTitle: string;
  concept: string;
  videoUrl: string;
  videoPath: string;
};

type SubmissionRow = {
  id: string;
  receipt_number: string;
  division: "template" | "original";
  artist_name: string;
  artwork_title: string;
  video_title: string;
  concept: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
};

const local = new Map<string, SubmissionRow>(demoSubmissions.map((item) => [item.id, {
  id: item.id,
  receipt_number: item.receiptNumber,
  division: item.division,
  artist_name: item.artistName,
  artwork_title: item.artworkTitle,
  video_title: item.videoTitle,
  concept: item.concept,
  description: item.description,
  video_url: item.videoUrl,
  thumbnail_url: item.thumbnailUrl,
  created_at: item.createdAt,
}]));

function blobToken() {
  return process.env.MEDIA_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

async function removeBlob(url: string) {
  if (!url || !url.includes("blob.vercel-storage.com")) return;
  const token = blobToken();
  if (!token) return;
  try {
    await del(url, { token });
  } catch {
    // Database changes should not fail because an old CDN object was already removed.
  }
}

async function syncAssignments(submissionId: string, division: SubmissionRow["division"]) {
  const db = getSupabaseAdmin();
  const { data: judges, error: judgeError } = await db.from("app_users").select("id,division").eq("role", "judge").eq("is_active", true);
  if (judgeError) throw new Error(judgeError.message);

  const eligibleIds = new Set((judges ?? []).filter((judge) => judge.division === "all" || judge.division === division).map((judge) => judge.id));
  const { data: assignments, error: assignmentError } = await db.from("judge_assignments").select("judge_id").eq("submission_id", submissionId);
  if (assignmentError) throw new Error(assignmentError.message);

  const obsoleteIds = (assignments ?? []).map((item) => item.judge_id).filter((id) => !eligibleIds.has(id));
  if (obsoleteIds.length) {
    const { error: evaluationError } = await db.from("evaluation_records").delete().eq("submission_id", submissionId).in("judge_id", obsoleteIds);
    if (evaluationError) throw new Error(evaluationError.message);
    const { error: deleteError } = await db.from("judge_assignments").delete().eq("submission_id", submissionId).in("judge_id", obsoleteIds);
    if (deleteError) throw new Error(deleteError.message);
  }

  const existingIds = new Set((assignments ?? []).map((item) => item.judge_id));
  const rows = [...eligibleIds].filter((id) => !existingIds.has(id)).map((id) => ({ judge_id: id, submission_id: submissionId, status: "not_started", updated_at: new Date().toISOString() }));
  if (rows.length) {
    const { error } = await db.from("judge_assignments").upsert(rows, { onConflict: "judge_id,submission_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
}

export function parseSubmissionPayload(form: FormData): SubmissionPayload {
  const receiptNumber = String(form.get("receiptNumber") || "").trim();
  const division = form.get("division") === "original" ? "original" : "template";
  const artistName = String(form.get("artistName") || "").trim();
  const artworkTitle = String(form.get("artworkTitle") || "").trim();
  const concept = String(form.get("concept") || "").trim();
  const videoUrl = String(form.get("videoUrl") || "").trim();
  const videoPath = String(form.get("videoPath") || "").trim();
  if (!receiptNumber || !artistName || !artworkTitle) throw new Error("접수번호, 작가명, 작품명을 모두 입력해 주세요.");
  return { receiptNumber, division, artistName, artworkTitle, concept, videoUrl, videoPath };
}

export async function listSubmissions() {
  if (!hasSupabaseConfig()) return [...local.values()];
  const { data, error } = await getSupabaseAdmin().from("competition_submissions").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SubmissionRow[];
}

export async function createSubmission(payload: SubmissionPayload) {
  const id = `s-${crypto.randomUUID()}`;
  let videoUrl = payload.videoUrl;
  if (!videoUrl && payload.videoPath && hasSupabaseConfig()) videoUrl = getSupabaseAdmin().storage.from("submission-videos").getPublicUrl(payload.videoPath).data.publicUrl;
  const row: SubmissionRow = {
    id,
    receipt_number: payload.receiptNumber,
    division: payload.division,
    artist_name: payload.artistName,
    artwork_title: payload.artworkTitle,
    video_title: payload.artworkTitle,
    concept: payload.concept,
    description: payload.concept,
    video_url: videoUrl,
    thumbnail_url: "",
    created_at: new Date().toISOString().slice(0, 10),
  };

  if (!hasSupabaseConfig()) {
    if ([...local.values()].some((item) => item.receipt_number === row.receipt_number)) throw new Error("이미 등록된 접수번호입니다.");
    local.set(row.id, row);
    return row;
  }

  const { data, error } = await getSupabaseAdmin().from("competition_submissions").insert(row).select("*").single();
  if (error?.code === "23505") throw new Error("이미 등록된 접수번호입니다.");
  if (error) throw new Error(error.message);
  await syncAssignments(row.id, row.division);
  return data as SubmissionRow;
}

export async function updateSubmission(id: string, payload: SubmissionPayload) {
  if (!hasSupabaseConfig()) {
    const existing = local.get(id);
    if (!existing) return null;
    if ([...local.values()].some((item) => item.id !== id && item.receipt_number === payload.receiptNumber)) throw new Error("이미 등록된 접수번호입니다.");
    const updated = { ...existing, receipt_number: payload.receiptNumber, division: payload.division, artist_name: payload.artistName, artwork_title: payload.artworkTitle, video_title: payload.artworkTitle, concept: payload.concept, description: payload.concept, video_url: payload.videoUrl || existing.video_url };
    local.set(id, updated);
    return updated;
  }

  const db = getSupabaseAdmin();
  const { data: existing, error: findError } = await db.from("competition_submissions").select("*").eq("id", id).maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!existing) return null;
  const nextVideoUrl = payload.videoUrl || existing.video_url;
  const { data, error } = await db.from("competition_submissions").update({
    receipt_number: payload.receiptNumber,
    division: payload.division,
    artist_name: payload.artistName,
    artwork_title: payload.artworkTitle,
    video_title: payload.artworkTitle,
    concept: payload.concept,
    description: payload.concept,
    video_url: nextVideoUrl,
  }).eq("id", id).select("*").single();
  if (error?.code === "23505") throw new Error("이미 등록된 접수번호입니다.");
  if (error) throw new Error(error.message);
  await syncAssignments(id, payload.division);
  if (payload.videoUrl && payload.videoUrl !== existing.video_url) await removeBlob(existing.video_url);
  return data as SubmissionRow;
}

export async function deleteSubmission(id: string) {
  if (!hasSupabaseConfig()) return local.delete(id);
  const db = getSupabaseAdmin();
  const { data: existing, error: findError } = await db.from("competition_submissions").select("video_url").eq("id", id).maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!existing) return false;
  const { error: evaluationError } = await db.from("evaluation_records").delete().eq("submission_id", id);
  if (evaluationError) throw new Error(evaluationError.message);
  const { error: assignmentError } = await db.from("judge_assignments").delete().eq("submission_id", id);
  if (assignmentError) throw new Error(assignmentError.message);
  const { error } = await db.from("competition_submissions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await removeBlob(existing.video_url);
  return true;
}
