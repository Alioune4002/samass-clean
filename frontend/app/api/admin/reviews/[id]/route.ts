import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import { changeReviewStatus } from "@/lib/server/reviewsStore";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string };
    if (body.action !== "publish" && body.action !== "hide" && body.action !== "reject") {
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    return NextResponse.json(await changeReviewStatus(id, body.action));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action impossible." }, { status: 400 });
  }
}
