import { NextResponse } from "next/server";
import { listBookings, listContactMessages } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const [bookings, messages] = await Promise.all([
      listBookings(),
      listContactMessages(),
    ]);

    return NextResponse.json({
      ok: true,
      bookings: bookings.length,
      messages: messages.length,
    });
  } catch (error) {
    console.error("Storage health check failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
