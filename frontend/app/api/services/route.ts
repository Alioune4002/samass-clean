import { NextResponse } from "next/server";
import { getServiceCatalog } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getServiceCatalog());
  } catch (error) {
    console.error("Services catalog error:", error);
    return NextResponse.json({ error: "Catalogue indisponible." }, { status: 500 });
  }
}
