import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ error: "Message incomplet." }, { status: 400 });
    }
    const message = await createContactMessage({
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: body.phone ? String(body.phone).trim() : "",
      message: String(body.message).trim(),
    });
    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Impossible d'envoyer le message." }, { status: 500 });
  }
}
