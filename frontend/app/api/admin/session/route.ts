import { NextResponse } from "next/server";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  validateAdminPassword,
} from "@/lib/server/adminSession";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!body.password || !validateAdminPassword(body.password)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ authenticated: false });
}
