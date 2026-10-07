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
  const expectedPrice = tantrique?.durations_prices?.[90] ?? null;

  const candidates = [
    "zai/glm-5.3-flash",
    "inclusionai/ling-3.1-flash-free",
  ];

  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const result = await generateText({
        model,
        system:
          "Tu testes le moteur du Guide SAMASS. Réponds uniquement par une phrase française courte et factuelle.",
        prompt: `Le tarif 90 minutes du massage tantrique fourni par le catalogue est ${expectedPrice} €. Confirme ce tarif en une phrase.`,
        maxOutputTokens: 80,
        maxRetries: 1,
      });

      return NextResponse.json({
        ok: true,
        model_used: model,
        model_answer: result.text,
        expected_price: expectedPrice,
      });
    } catch (error) {
      lastError = error;
      console.warn(`Assistant health model unavailable: ${model}`);
    }
  }

  throw lastError || new Error("Aucun modèle disponible.");
}
