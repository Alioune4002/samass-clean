"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ASSISTANT_SCOPE_NOTE,
  ASSISTANT_STARTER_SUGGESTIONS,
} from "@/lib/assistantKnowledge";
import { AssistantResponse, resolveAssistantQuery } from "@/lib/assistantEngine";

type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  response: AssistantResponse;
};

type ChatMessage = UserMessage | AssistantMessage;

function createWelcomeResponse(): AssistantResponse {
  return {
    type: "knowledge",
    title: "Assistant SAMASS",
    shortAnswer:
      "Je peux vous guider sur les massages, les tarifs, les durées, le déroulement d’une séance et la réservation.",
    longAnswer: [ASSISTANT_SCOPE_NOTE],
    links: [
      { href: "/services", label: "Voir les massages" },
      { href: "/reservation", label: "Réserver" },
      { href: "/contact", label: "Contacter Sam" },
    ],
    suggestions: ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4),
    matches: [],
  };
}

function createWelcomeMessage(): AssistantMessage {
  return {
    id: "welcome",
    role: "assistant",
    response: createWelcomeResponse(),
  };
}

function AssistantLinkChip({
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
      className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
    >
      {label}
    </Link>
  );
}

function AssistantTypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-[28px] rounded-bl-lg border border-white/80 bg-white px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:120ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({
  message,
  expanded,
  onToggleExpanded,
  onNavigate,
}: {
  message: AssistantMessage;
  expanded: boolean;
  onToggleExpanded: () => void;
  onNavigate: () => void;
}) {
  const { response } = message;
  const showExpand =
    response.longAnswer.length > 1 || (response.article?.body.length || 0) > 0;

  return (
    <div className="max-w-[92%] rounded-[28px] rounded-bl-lg border border-white/80 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
            {response.title}
          </p>
          <p className="mt-3 text-[15px] leading-7 text-slate-700">
            {response.shortAnswer}
          </p>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
          {response.longAnswer.map((paragraph, index) => (
            <p key={`${message.id}-${index}`}>{paragraph}</p>
          ))}

          {response.article ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Conseil
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
            className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {response.links.map((link) => (
          <AssistantLinkChip
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
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [isResponding, setIsResponding] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const responseTimerRef = useRef<number | null>(null);
  const lastPathnameRef = useRef<string | null>(pathname ?? null);

  const latestAssistantMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message): message is AssistantMessage => message.role === "assistant") ??
      createWelcomeMessage(),
    [messages]
  );

  const activeSuggestions =
    latestAssistantMessage.response.suggestions?.length
      ? latestAssistantMessage.response.suggestions.slice(0, 4)
      : ASSISTANT_STARTER_SUGGESTIONS.slice(0, 4);

  function closeAssistant() {
    setOpen(false);
  }

  function resetConversation() {
    if (responseTimerRef.current) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    setMessages([createWelcomeMessage()]);
    setExpandedMessages({});
    setInputValue("");
    setIsResponding(false);
  }

  function toggleMessageExpansion(id: string) {
    setExpandedMessages((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function pushAssistantResponse(question: string) {
    const response = resolveAssistantQuery(question);
    const assistantMessage: AssistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      response,
    };

    setMessages((current) => [...current, assistantMessage]);
    setExpandedMessages((current) => ({
      ...current,
      [assistantMessage.id]: response.longAnswer.length <= 1 && !response.article,
    }));
    setIsResponding(false);
    responseTimerRef.current = null;
  }

  function submitQuestion(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isResponding) return;

    const userMessage: UserMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setOpen(true);
    setIsResponding(true);

    responseTimerRef.current = window.setTimeout(() => {
      pushAssistantResponse(trimmedQuestion);
    }, 300);
  }

  useEffect(() => {
    const node = scrollRef.current;
    if (!open || !node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isResponding, open]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 180);
    textarea.style.height = `${Math.max(nextHeight, 56)}px`;
  }, [inputValue]);

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAssistant();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathnameRef.current && lastPathnameRef.current !== pathname) {
      closeAssistant();
    }
    lastPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (responseTimerRef.current) {
        window.clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-500/80 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(5,150,105,0.3)] transition hover:bg-emerald-500 md:bottom-6 md:right-6"
          aria-label="Ouvrir l'assistant SAMASS"
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/90" />
          Assistant SAMASS
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
          onClick={closeAssistant}
        >
          <div
            className="absolute inset-0 flex items-end justify-end md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f6fbf9_0%,#ffffff_100%)] md:h-[min(780px,calc(100dvh-40px))] md:w-[460px] md:rounded-[30px] md:border md:border-white/80 md:shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
              <div className="border-b border-slate-200/80 bg-white/88 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      Assistant local
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Assistant SAMASS
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Réponses rapides sur les massages, les séances et la réservation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeAssistant}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Nouvelle discussion
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 md:px-6"
              >
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[88%] rounded-[28px] rounded-br-lg bg-slate-950 px-5 py-4 text-[15px] leading-7 text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
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

                {isResponding ? <AssistantTypingBubble /> : null}
              </div>

              <div className="border-t border-slate-200/80 bg-white/92 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl md:px-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  {activeSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submitQuestion(suggestion)}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
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
                  className="flex items-end gap-3"
                >
                  <div className="flex-1 rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100/70">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      placeholder="Posez votre question sur les massages, la séance ou la réservation…"
                      className="block min-h-[56px] w-full resize-none rounded-[26px] bg-transparent px-4 py-4 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"
                      rows={1}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isResponding}
                    className="inline-flex h-14 shrink-0 items-center justify-center rounded-[24px] bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
