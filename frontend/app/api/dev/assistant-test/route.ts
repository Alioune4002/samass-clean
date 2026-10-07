import { NextResponse } from "next/server";
import {
  resolveAssistantConversation,
  type AssistantConversationTurn,
} from "@/lib/assistantEngine";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history: AssistantConversationTurn[] = [];

  const q1 =
    "Je veux me reconnecter à mon corps et prendre mon temps, tu me conseilles quoi ?";
  const a1 = resolveAssistantConversation(q1, history);
  history.push({ role: "user", text: q1 });
  history.push({
    role: "assistant",
    text: [a1.title, a1.shortAnswer, ...a1.longAnswer].join(" "),
  });

  const q2 = "Et en 90 min c’est combien ?";
  const a2 = resolveAssistantConversation(q2, history);
  history.push({ role: "user", text: q2 });
  history.push({
    role: "assistant",
    text: [a2.title, a2.shortAnswer, ...a2.longAnswer].join(" "),
  });

  const q3 = "Le massage tantrique c’est sexuel ?";
  const a3 = resolveAssistantConversation(q3, history);

  return NextResponse.json({
    first: { question: q1, answer: a1 },
    follow_up: { question: q2, answer: a2 },
    boundary: { question: q3, answer: a3 },
  });
}
