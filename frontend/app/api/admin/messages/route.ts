import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import { listContactMessages } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json(await listContactMessages());
}
