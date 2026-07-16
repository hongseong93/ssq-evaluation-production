import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { rankedSubmissions } from "@/lib/scoring";

export const runtime = "nodejs";
export async function GET() {
  const rows = rankedSubmissions().map((item) => ({ Rank: item.rank, Receipt: item.receiptNumber, Division: item.division, Artist: item.artistName, Artwork: item.artworkTitle, Average: item.summary.average || "", Highest: item.summary.max || "", Lowest: item.summary.min || "", Deviation: item.summary.deviation || "", Reviewers: item.summary.reviewers }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Scores");
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(bytes, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="submission-scores.xlsx"' } });
}
