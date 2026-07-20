import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminOverview, scoreTotal } from "@/lib/server/admin-overview";

export const runtime = "nodejs";
export async function GET() {
  const data = await getAdminOverview();
  const rows = data.submissions.map((submission) => {
    const totals = data.evaluations.filter((item) => item.submission_id === submission.id && ["completed", "submitted"].includes(item.status)).map((item) => scoreTotal(item.score_entries, data.criteria));
    return { Receipt: submission.receipt_number, Division: submission.division, Artist: submission.artist_name, Artwork: submission.artwork_title, Average: totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : "", Highest: totals.length ? Math.max(...totals) : "", Lowest: totals.length ? Math.min(...totals) : "", Reviewers: totals.length };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Scores");
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(bytes, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="submission-scores.xlsx"' } });
}
