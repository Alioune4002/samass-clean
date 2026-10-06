import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import { deleteContactMessage, markContactRead } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await context.params;
  const message = await markContactRead(id);
  if (!message) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(message);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await context.params;
  const deleted = await deleteContactMessage(id);
  if (!deleted) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
