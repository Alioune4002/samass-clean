"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ASSISTANT_SCOPE_NOTE,
  ASSISTANT_STARTER_SUGGESTIONS,
} from "@/lib/assistantKnowledge";
import {
  AssistantResponse,
  resolveAssistantQuery,
} from "@/lib/assistantEngine";

type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | {
      id: string;
      role: "assistant";
      text: string;
      response: AssistantResponse;
    };

function createWelcomeResponse(): AssistantResponse {
  return {
    type: "knowledge",
    title: "Assistant SAMASS",
    shortAnswer:
      "Je peux vous aider à choisir un massage, comprendre le déroulement d’une séance, retrouver les tarifs, les durées et les conseils avant ou après votre rendez-vous.",
    longAnswer: [ASSISTANT_SCOPE_NOTE],
    links: [
      { href: "/services", label: "Voir les massages" },
      { href: "/reservation", label: "Réserver" },
      { href: "/contact", label: "Contacter Sam" },
    ],
    suggestions: ASSISTANT_STARTER_SUGGESTIONS,
    matches: [],
  };
}

function BubbleLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 transition"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function AssistantBubble({
  message,
  expanded,
  onToggleExpanded,
  onSelectSuggestion,
}: {
  message: Extract<ChatMessage, { role: "assistant" }>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onSelectSuggestion: (value: string) => void;
}) {
  const { response } = message;
  const showExpand =
    response.longAnswer.length > 1 || (response.article?.body.length || 0) > 0;

  return (
    <div className="max-w-[92%] rounded-3xl rounded-bl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
        {response.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {response.shortAnswer}
      </p>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          {response.longAnswer.map((paragraph, index) => (
            <p key={`${message.id}-long-${index}`}>{paragraph}</p>
          ))}

          {response.article ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Article conseil
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {response.article.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {response.article.summary}
              </p>
              <div className="mt-3 space-y-3">
                {response.article.body.map((paragraph, index) => (
                  <p key={`${message.id}-article-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {showExpand ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      ) : null}

      <BubbleLinks links={response.links} />

      {response.suggestions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {response.suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={`${message.id}-${suggestion}`}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SamassAssistant() {
  const pathname = usePathname();
  const shouldHide =
    pathname?.startsWith("/admin") || pathname?.startsWith("/admin-samass-98342");

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "",
      response: createWelcomeResponse(),
    },
  ]);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>(
    {}
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, open]);

  if (shouldHide) {
    return null;
  }

  function toggleMessageExpansion(id: string) {
    setExpandedMessages((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function submitQuestion(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const response = resolveAssistantQuery(trimmedQuestion);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedQuestion,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: "",
      response,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setExpandedMessages((current) => ({
      ...current,
      [assistantMessage.id]: false,
    }));
    setInputValue("");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/15 hover:bg-emerald-500 transition md:bottom-6 md:right-6"
        aria-label="Ouvrir l'assistant SAMASS"
      >
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/90" />
        Assistant SAMASS
      </button>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[78vh] max-h-[720px] w-full flex-col rounded-t-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] shadow-2xl md:bottom-24 md:right-6 md:left-auto md:h-[680px] md:w-[430px] md:rounded-[28px]">
          <div className="flex items-start justify-between gap-4 border-b border-emerald-100 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Assistant local
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Questions fréquentes SAMASS
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Réponses locales, rapides et centrées sur les massages SAMASS.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-3xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-start">
                  <AssistantBubble
                    message={message}
                    expanded={Boolean(expandedMessages[message.id])}
                    onToggleExpanded={() => toggleMessageExpansion(message.id)}
                    onSelectSuggestion={submitQuestion}
                  />
                </div>
              )
            )}
          </div>

          <div className="border-t border-emerald-100 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitQuestion(suggestion)}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitQuestion(inputValue);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Posez votre question sur les massages, les tarifs, la réservation..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                rows={2}
              />
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
