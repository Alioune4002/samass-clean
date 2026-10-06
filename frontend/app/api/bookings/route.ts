import { NextResponse } from "next/server";
import { createBooking } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = [
      body.client_name,
      body.client_email,
      body.service_title,
      body.duration_minutes,
      body.requested_datetime,
    ];
    if (required.some((value) => !value)) {
      return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
    }

    const booking = await createBooking({
      client_name: String(body.client_name).trim(),
      client_email: String(body.client_email).trim(),
      client_phone: body.client_phone ? String(body.client_phone).trim() : "",
      client_comment: body.client_comment ? String(body.client_comment).trim() : "",
      service_id: body.service_id ? Number(body.service_id) : undefined,
      service_title: String(body.service_title).trim(),
      duration_minutes: Number(body.duration_minutes),
      requested_datetime: String(body.requested_datetime),
      requested_label: body.requested_label ? String(body.requested_label) : undefined,
    });

    return NextResponse.json({ booking, message: "Votre demande a bien été transmise à Sam." });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer la demande pour le moment." },
      { status: 500 }
    );
  }
}
