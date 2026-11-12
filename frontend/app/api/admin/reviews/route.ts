import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import { getAllReviews, sendReviewInvitation } from "@/lib/server/reviewsStore";
export const runtime = "nodejs";
export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  return NextResponse.json(await getAllReviews(), { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(await sendReviewInvitation(body), { status: 201 });
  } catch (error) {
    console.error("SAMASS invitation error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invitation non envoyée." }, { status: 400 });
  }
}
