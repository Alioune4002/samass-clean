import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getServiceCatalog } from "@/lib/server/samassStore";

export const runtime = "nodejs";
export const maxDuration = 30;

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type AssistantPayload = {
  answer: string;
  suggestions: string[];
  action?: {
    label: string;
    href: "/services" | "/reservation" | "/contact";
  } | null;
};

function cleanTurns(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-14)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role =
        (item as { role?: unknown }).role === "assistant"
          ? "assistant"
          : (item as { role?: unknown }).role === "user"
            ? "user"
            : null;
      const content =
        typeof (item as { content?: unknown }).content === "string"
          ? (item as { content: string }).content.trim().slice(0, 1600)
          : "";

      return role && content ? { role, content } : null;
    })
    .filter((item): item is ChatTurn => Boolean(item));
}

function parseModelPayload(text: string): AssistantPayload {
  const stripped = text
    .trim()
    .replace(/^\`\`\`json\s*/i, "")
    .replace(/\s*\`\`\`$/i, "");

  try {
    const parsed = JSON.parse(stripped) as Partial<AssistantPayload>;
    const answer =
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer.trim()
        : stripped;

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const allowedHrefs = new Set(["/services", "/reservation", "/contact"]);
    const action =
      parsed.action &&
      typeof parsed.action === "object" &&
      typeof parsed.action.label === "string" &&
      typeof parsed.action.href === "string" &&
      allowedHrefs.has(parsed.action.href)
        ? {
            label: parsed.action.label.trim().slice(0, 60),
            href: parsed.action.href as "/services" | "/reservation" | "/contact",
          }
        : null;

    return { answer, suggestions, action };
  } catch {
    return {
      answer:
        stripped ||
        "Je n’ai pas réussi à formuler ma réponse. Réessayez en une phrase.",
      suggestions: [],
      action: null,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = cleanTurns(body.messages);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Message manquant." }, { status: 400 });
    }

    const services = await getServiceCatalog();

    const serviceContext = services
      .filter((service) => service.is_active !== false)
      .map((service) => ({
        title: service.title,
        description: service.description,
        long_description: service.long_description,
        durations_prices: service.durations_prices,
      }));

    const system = `
Tu es Guide SAMASS, le concierge conversationnel du site SAMASS à Quimper.
Tu réponds comme un vrai interlocuteur : naturel, intelligent, précis, chaleureux et jamais robotique.

CONNAISSANCES CERTAINES SUR SAMASS
- SAMASS propose des massages bien-être à Quimper.
- C'est un accueil privé et personnel : Sam reçoit lui-même les clients dans un cocon aménagé chez lui. Ce n'est ni une chaîne, ni une agence, ni un grand salon.
- Le lieu est volontairement intime, calme, chaleureux et peu éclairé pendant les séances.
- La réservation fonctionne comme une demande : le client propose une prestation, une durée, une date et une heure, puis Sam confirme personnellement ou propose une alternative.
- Le massage tantrique est une expérience de bien-être sensorielle, lente, centrée sur la présence et la reconnexion au corps. Il ne constitue pas une promesse de prestation sexuelle.
- Le cadre, le consentement et les limites du client doivent toujours rester clairs et respectés.
- Sam est le jeune masseur qui accueille personnellement. Le site peut montrer une photo discrète de lui sans afficher son visage. Ne donne aucune information privée non publiée (adresse exacte, vie personnelle, nom complet, âge, etc.).
- Pour une question médicale, une douleur importante, une grossesse, une blessure, une pathologie ou un traitement : ne pose pas de diagnostic et ne promets pas de bénéfice médical. Conseille de vérifier avec un professionnel de santé et/ou de contacter Sam avant la séance.
- Si une information n'est pas dans ce contexte, dis clairement que tu ne peux pas la confirmer et propose de demander à Sam. N'invente jamais.

PRESTATIONS ET TARIFS ACTUELS
${JSON.stringify(serviceContext)}

STYLE DE RÉPONSE
- Réponds en français sauf si l'utilisateur parle clairement une autre langue.
- Réponds directement à la question, sans réciter toute la brochure.
- En général 2 à 6 phrases. Tu peux être plus détaillé si la question le demande.
- Garde le contexte de toute la conversation fournie.
- Tu peux gérer les questions imprévues et les formulations familières.
- Si l'utilisateur hésite entre plusieurs massages, pose une seule question utile si nécessaire puis recommande.
- Ne répète pas mot pour mot une réponse précédente.
- Ne pousse pas systématiquement à réserver.
- Les suggestions doivent être réellement liées à ce que l'utilisateur vient de demander. Si aucune suite naturelle n'est utile, renvoie [].
- Maximum 3 suggestions, courtes, formulées comme de vraies questions que l'utilisateur pourrait vouloir poser ensuite.
- Tu peux proposer UNE action uniquement lorsqu'elle est naturellement utile :
  /services = découvrir/comparer les massages
  /reservation = faire une demande de rendez-vous
  /contact = parler directement à Sam

FORMAT OBLIGATOIRE
Réponds uniquement avec un objet JSON valide, sans markdown, exactement sous cette forme :
{
  "answer": "réponse naturelle",
  "suggestions": ["question pertinente", "autre question pertinente"],
  "action": {"label": "texte court", "href": "/reservation"} ou null
}
`;

    const result = await generateText({
      model: "inclusionai/ling-3.1-flash-free",
      system,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      maxOutputTokens: 700,
    });

    return NextResponse.json(parseModelPayload(result.text));
  } catch (error) {
    console.error("SAMASS assistant error:", error);
    return NextResponse.json(
      {
        answer:
          "Je n’arrive pas à répondre correctement pour le moment. Vous pouvez réessayer dans quelques instants ou contacter Sam directement.",
        suggestions: ["Contacter Sam"],
        action: { label: "Contacter Sam", href: "/contact" },
      },
      { status: 200 }
    );
  }
}
