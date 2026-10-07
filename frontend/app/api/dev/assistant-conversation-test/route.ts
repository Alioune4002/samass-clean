import { NextRequest, NextResponse } from "next/server";
import { POST as assistantPost } from "@/app/api/assistant/route";

export const runtime = "nodejs";
export const maxDuration = 60;

type Turn = { role: "user" | "assistant"; content: string };

async function ask(history: Turn[], question: string) {
  const messages: Turn[] = [...history, { role: "user", content: question }];
  const request = new NextRequest("https://samass.local/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const response = await assistantPost(request);
  const payload = (await response.json()) as {
    answer?: string;
    suggestions?: string[];
    action?: unknown;
  };

  return {
    messages,
    answer: payload.answer || "",
    suggestions: payload.suggestions || [],
    action: payload.action ?? null,
  };
}

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let history: Turn[] = [];

  const first = await ask(
    history,
    "Je cherche quelque chose de très lent et sensoriel, je veux surtout me reconnecter à mon corps. Tu me conseilles quoi ?"
  );
  history = [
    ...first.messages,
    { role: "assistant", content: first.answer },
  ];

  const second = await ask(
    history,
    "Et si je prends 90 minutes, ça coûte combien ?"
  );
  history = [
    ...second.messages,
    { role: "assistant", content: second.answer },
  ];

  const third = await ask(history, "Le massage tantrique, c'est sexuel ?");
  history = [
    ...third.messages,
    { role: "assistant", content: third.answer },
  ];

  const fourth = await ask(history, "À quoi ressemble Sam ?");
  history = [
    ...fourth.messages,
    { role: "assistant", content: fourth.answer },
  ];

  const fifth = await ask(
    history,
    "Tu peux me conseiller un bon restaurant italien à Quimper ?"
  );

  return NextResponse.json({
    first: { answer: first.answer, suggestions: first.suggestions },
    second: { answer: second.answer, suggestions: second.suggestions },
    third: { answer: third.answer, suggestions: third.suggestions },
    fourth: { answer: fourth.answer, suggestions: fourth.suggestions },
    fifth: { answer: fifth.answer, suggestions: fifth.suggestions },
  });
}
