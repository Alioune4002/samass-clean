import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getServiceCatalog } from "@/lib/server/samassStore";
import {
  resolveAssistantConversation,
  setAssistantServiceCatalog,
} from "@/lib/assistantEngine";

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
    .slice(-24)
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

  let jsonCandidate = stripped;
  const embeddedJsonStart = stripped.lastIndexOf('{"answer"');
  const embeddedJsonEnd = stripped.lastIndexOf("}");

  if (embeddedJsonStart >= 0 && embeddedJsonEnd > embeddedJsonStart) {
    jsonCandidate = stripped.slice(embeddedJsonStart, embeddedJsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as Partial<AssistantPayload>;
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
    setAssistantServiceCatalog(services);

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
- Sam est un jeune homme noir et c'est lui qui accueille personnellement les clients. Il a été formé à l'Hypoténuse, École française du massage.
- Si l'utilisateur demande à quoi ressemble Sam, réponds simplement avec les éléments certains ci-dessus. Ne parle jamais du cadrage des photos, de visage caché, de confidentialité, de choix de communication ou de raisons internes.
- Ne donne aucune information privée non publiée (adresse exacte, vie personnelle, nom complet, âge, etc.).
- Pour une question médicale, une douleur importante, une grossesse, une blessure, une pathologie ou un traitement : ne pose pas de diagnostic et ne promets pas de bénéfice médical. Conseille de vérifier avec un professionnel de santé et/ou de contacter Sam avant la séance.
- Si une information sur SAMASS n'est pas dans ce contexte, dis clairement que tu ne peux pas la confirmer et propose de demander à Sam. N'invente jamais.
- Tu peux tenir une conversation naturelle et répondre aux petites formules sociales, mais tu n'es pas un assistant généraliste du web. Pour les demandes sans rapport avec SAMASS, le massage, la préparation d'une séance ou l'accueil, explique brièvement ton périmètre au lieu d'inventer une recommandation externe.

PRESTATIONS ET TARIFS ACTUELS
${JSON.stringify(serviceContext)}

STYLE DE CONVERSATION
- Réponds en français sauf si l'utilisateur parle clairement une autre langue.
- Tu n'es PAS une FAQ et tu n'utilises PAS de réponse pré-écrite. Compose chaque réponse spécifiquement à partir du message actuel et de l'historique.
- Réponds d'abord exactement à ce qui est demandé. Ne récite jamais toute la brochure si une phrase suffit.
- En général 2 à 6 phrases. Tu peux être plus détaillé si la question le demande vraiment.
- Garde le contexte des échanges précédents : pronoms, durée évoquée, massage évoqué, hésitations et préférences.
- Comprends les formulations familières, fautes, messages très courts, questions imprévues et sous-entendus raisonnables.
- Si le message est ambigu et qu'une précision change réellement la réponse, pose UNE question courte au lieu d'inventer.
- Si l'utilisateur hésite entre plusieurs massages, raisonne sur son besoin et recommande clairement, en expliquant pourquoi en une ou deux phrases.
- Si l'utilisateur exprime une inquiétude, réponds d'abord à l'inquiétude avant de parler de réservation.
- Ne répète pas une réponse précédente sauf si l'utilisateur le demande.
- Ne pousse jamais systématiquement à réserver.
- N'utilise pas des tournures de chatbot telles que "selon notre base de connaissances", "je suis programmé pour" ou "je ne peux répondre qu'à".
- Pour une question hors sujet, reste humain : explique brièvement que tu es le guide SAMASS et ramène doucement vers ce que tu peux aider à faire.
- Les suggestions sont facultatives. Elles doivent correspondre à une suite réellement probable de CET échange. Si elles n'apportent rien, renvoie [].
- Maximum 3 suggestions, courtes, sans dupliquer ce que tu viens déjà de dire.
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

    const modelCandidates = [
      "inclusionai/ling-3.1-flash-free",
      "poolside/laguna-s-2.1-free",
    ];

    let generatedText = "";
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        const result = await generateText({
          model,
          system,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          maxOutputTokens: 700,
          reasoning: "none",
          maxRetries: 1,
        });
        generatedText = result.text;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`SAMASS assistant model unavailable: ${model}`);
      }
    }

    if (!generatedText) {
      console.warn("SAMASS free AI unavailable, using local concierge fallback.", lastError);

      const latest = messages[messages.length - 1];
      const history = messages.slice(0, -1).map((message) => ({
        role: message.role,
        text: message.content,
      }));
      const fallback = resolveAssistantConversation(latest.content, history);

      const answer = [fallback.shortAnswer, ...fallback.longAnswer.slice(0, 2)]
        .filter(Boolean)
        .join("\n\n");

      const firstLink = fallback.links.find((link) =>
        ["/services", "/reservation", "/contact"].includes(link.href)
      );

      return NextResponse.json({
        answer,
        suggestions: fallback.suggestions.slice(0, 3),
        action: firstLink
          ? {
              label: firstLink.label,
              href: firstLink.href,
            }
          : null,
      });
    }

    return NextResponse.json(parseModelPayload(generatedText));
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
