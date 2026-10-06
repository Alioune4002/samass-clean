import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import {
  getBooking,
  updateBookingStatus,
  type BookingStatus,
} from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await context.params;
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { status?: BookingStatus };
  if (!body.status || !["pending", "confirmed", "canceled"].includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const booking = await updateBookingStatus(id, body.status);
  if (!booking) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(booking);
}
