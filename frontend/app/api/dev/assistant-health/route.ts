import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getServiceCatalog } from "@/lib/server/samassStore";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const services = await getServiceCatalog();
  const tantrique = services.find((service) => service.title === "Massage Tantrique");

  const result = await generateText({
    model: "openai/gpt-6-luna",
    system:
      "Tu testes le moteur du Guide SAMASS. Réponds uniquement par une phrase française courte et factuelle.",
    prompt: `Le tarif 90 minutes du massage tantrique fourni par le catalogue est ${tantrique?.durations_prices?.[90]} €. Confirme ce tarif en une phrase.`,
    maxOutputTokens: 80,
  });

  return NextResponse.json({
    ok: true,
    model_answer: result.text,
    expected_price: tantrique?.durations_prices?.[90] ?? null,
  });
}
