import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/server/adminSession";
import {
  getAdminServiceCatalog,
  saveServiceCatalog,
} from "@/lib/server/samassStore";
import { Service } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json(await getAdminServiceCatalog());
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    services?: Service[];
  };
  if (!Array.isArray(body.services)) {
    return NextResponse.json({ error: "Catalogue invalide." }, { status: 400 });
  }

  return NextResponse.json(await saveServiceCatalog(body.services));
}
