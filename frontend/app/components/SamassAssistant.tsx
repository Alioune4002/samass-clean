"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ASSISTANT_SCOPE_NOTE,
  ASSISTANT_STARTER_SUGGESTIONS,
} from "@/lib/assistantKnowledge";
import { AssistantResponse, resolveAssistantQuery } from "@/lib/assistantEngine";

type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | {
      id: string;
      role: "assistant";
      response: AssistantResponse;
    };

function createWelcomeResponse(): AssistantResponse {
  return {
    type: "knowledge",
    title: "Assistant SAMASS",
    shortAnswer:
      "Je peux vous aider à choisir un massage, retrouver les tarifs, les durées, comprendre le déroulement d’une séance et vous orienter vers la réservation ou le contact.",
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

function AssistantNavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 transition"
    >
      {label}
    </Link>
  );
}

function AssistantBubble({
  message,
  expanded,
  onToggleExpanded,
  onNavigate,
}: {
  message: Extract<ChatMessage, { role: "assistant" }>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onNavigate: () => void;
}) {
  const { response } = message;
  const showExpand =
    response.longAnswer.length > 1 || (response.article?.body.length || 0) > 0;

  return (
    <div className="w-full rounded-[26px] rounded-bl-md border border-emerald-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
        {response.title}
      </p>

      <p className="mt-2 text-sm leading-7 text-slate-700">{response.shortAnswer}</p>

      {expanded ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          {response.longAnswer.map((paragraph, index) => (
            <p key={`${message.response.title}-${index}`}>{paragraph}</p>
          ))}

          {response.article ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conseil pratique
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {response.article.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {response.article.summary}
              </p>
              <div className="mt-3 space-y-3">
                {response.article.body.map((paragraph, index) => (
                  <p key={`${response.article?.id}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {showExpand ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {response.links.map((link) => (
          <AssistantNavLink
            key={`${link.href}-${link.label}`}
            href={link.href}
            label={link.label}
            onNavigate={onNavigate}
          />
        ))}
      </div>
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
      response: createWelcomeResponse(),
    },
  ]);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>(
    {}
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastPathnameRef = useRef<string | null>(pathname ?? null);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      touchAction: document.body.style.touchAction,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = original.overflow;
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      document.body.style.touchAction = original.touchAction;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathnameRef.current && lastPathnameRef.current !== pathname) {
      setOpen(false);
    }
    lastPathnameRef.current = pathname;
  }, [pathname]);

  if (shouldHide) {
    return null;
  }

  function closeAssistant() {
    setOpen(false);
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
      response,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setExpandedMessages((current) => ({
      ...current,
      [assistantMessage.id]:
        response.longAnswer.length <= 1 && !response.article,
    }));
    setInputValue("");
    setOpen(true);
  }

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message): message is Extract<ChatMessage, { role: "assistant" }> => {
      return message.role === "assistant";
    });

  const activeSuggestions =
    latestAssistantMessage?.response.suggestions?.length
      ? latestAssistantMessage.response.suggestions.slice(0, 4)
      : ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4);

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/15 hover:bg-emerald-500 transition md:bottom-6 md:right-6"
          aria-label="Ouvrir l'assistant SAMASS"
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/90" />
          Assistant SAMASS
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]"
          onClick={closeAssistant}
        >
          <div
            className="absolute inset-0 flex items-end justify-end md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] shadow-2xl md:h-[min(720px,calc(100dvh-48px))] md:w-[440px] md:rounded-[30px] md:border md:border-emerald-100">
              <div className="border-b border-emerald-100 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                      Assistant local
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                      Questions fréquentes SAMASS
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Réponses locales, utiles et centrées sur les massages SAMASS.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeAssistant}
                    className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 md:px-5"
              >
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[86%] rounded-[24px] rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-7 text-white shadow-sm">
                        {message.text}
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <AssistantBubble
                        message={message}
                        expanded={Boolean(expandedMessages[message.id])}
                        onToggleExpanded={() => toggleMessageExpansion(message.id)}
                        onNavigate={closeAssistant}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="border-t border-emerald-100 bg-white/90 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur md:px-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  {activeSuggestions.map((suggestion) => (
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
                    placeholder="Posez votre question sur les massages, les tarifs, la séance..."
                    className="max-h-36 min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
          </div>
        </div>
      ) : null}
    </>
  );
}
