"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ASSISTANT_SCOPE_NOTE,
  ASSISTANT_STARTER_SUGGESTIONS,
} from "@/lib/assistantKnowledge";
import { AssistantResponse, resolveAssistantQuery } from "@/lib/assistantEngine";

type UserMessage = { id: string; role: "user"; text: string };
type AssistantMessage = { id: string; role: "assistant"; response: AssistantResponse };
type ChatMessage = UserMessage | AssistantMessage;
type LauncherPosition = { x: number; y: number };

const LAUNCHER_STORAGE_KEY = "samass_assistant_launcher_position";
const INTRO_DURATION_MS = 5000;
const RESPONSE_DELAY_MS = 300;
const ORB_SIZE = 44;

function createWelcomeResponse(): AssistantResponse {
  return {
    type: "knowledge",
    title: "Assistant SAMASS",
    shortAnswer:
      "Posez-moi vos questions avant de réserver : choix du massage, durée, tarifs, déroulement ou conseils.",
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
  return { id: "welcome", role: "assistant", response: createWelcomeResponse() };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getExpandedPosition(): LauncherPosition {
  if (typeof window === "undefined") return { x: 160, y: 640 };
  return {
    x: Math.max(112, window.innerWidth - 238),
    y: window.innerHeight - 118,
  };
}

function getCompactPosition(): LauncherPosition {
  if (typeof window === "undefined") return { x: 18, y: 640 };
  return {
    x: 18,
    y: window.innerHeight - 118,
  };
}

function readStoredLauncherPosition(): LauncherPosition | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LAUNCHER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LauncherPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;

    return {
      x: clamp(parsed.x, 8, window.innerWidth - ORB_SIZE - 8),
      y: clamp(parsed.y, 90, window.innerHeight - ORB_SIZE - 24),
    };
  } catch {
    return null;
  }
}

function saveLauncherPosition(position: LauncherPosition) {
  try {
    window.localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // localStorage peut être indisponible.
  }
}

function AssistantOrb({ compact }: { compact: boolean }) {
  return (
    <span
      className={`samass-orb relative flex shrink-0 items-center justify-center rounded-full ${
        compact ? "h-11 w-11" : "h-8 w-8"
      }`}
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200 via-emerald-600 to-emerald-950 shadow-[inset_0_4px_10px_rgba(255,255,255,0.55),inset_0_-10px_18px_rgba(6,78,59,0.5),0_10px_24px_rgba(5,150,105,0.25)]" />
      <span className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
      <span className="relative text-sm text-white drop-shadow-sm">✦</span>
    </span>
  );
}

function MagicTrail({ active }: { active: boolean }) {
  return (
    <span
      className={`samass-magic-trail pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="trail-line" />
      <span className="spark spark-1">✦</span>
      <span className="spark spark-2">✧</span>
      <span className="spark spark-3">✦</span>
      <span className="spark spark-4">•</span>
    </span>
  );
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
        <div className="flex items-center gap-2">
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
        {response.title}
      </p>

      <p className="mt-3 text-[15px] leading-7 text-slate-700">
        {response.shortAnswer}
      </p>

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

      {showExpand ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="mt-4 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      ) : null}

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
  const [compact, setCompact] = useState(false);
  const [moving, setMoving] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [isResponding, setIsResponding] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState<LauncherPosition | null>(null);
  const [dragging, setDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const responseTimerRef = useRef<number | null>(null);
  const introTimerRef = useRef<number | null>(null);
  const movingTimerRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const movedDuringDragRef = useRef(false);
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
    setCompact(true);
  }

  function openAssistant() {
    setCompact(true);
    setOpen(true);
  }

  function foldLauncher() {
    setMoving(true);
    setCompact(true);
    setLauncherPosition(readStoredLauncherPosition() ?? getCompactPosition());

    movingTimerRef.current = window.setTimeout(() => {
      setMoving(false);
    }, 1300);
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
    setExpandedMessages((current) => ({ ...current, [id]: !current[id] }));
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
    openAssistant();
    setIsResponding(true);

    responseTimerRef.current = window.setTimeout(() => {
      pushAssistantResponse(trimmedQuestion);
    }, RESPONSE_DELAY_MS);
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!compact) return;

    const rect = event.currentTarget.getBoundingClientRect();
    movedDuringDragRef.current = false;

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging || !compact) return;

    movedDuringDragRef.current = true;
    setMoving(true);

    setLauncherPosition({
      x: clamp(event.clientX - dragOffsetRef.current.x, 8, window.innerWidth - ORB_SIZE - 8),
      y: clamp(event.clientY - dragOffsetRef.current.y + ORB_SIZE / 2, 90, window.innerHeight - ORB_SIZE - 24),
    });
  }

  function endDrag() {
    if (!dragging) return;

    setDragging(false);
    setMoving(false);

    if (launcherPosition) saveLauncherPosition(launcherPosition);
  }

  function handleLauncherClick() {
    if (movedDuringDragRef.current) {
      movedDuringDragRef.current = false;
      return;
    }

    openAssistant();
  }

  useEffect(() => {
    const expanded = getExpandedPosition();
    setLauncherPosition(expanded);

    introTimerRef.current = window.setTimeout(() => {
      foldLauncher();
    }, INTRO_DURATION_MS);

    return () => {
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;

    if (lastPathnameRef.current && lastPathnameRef.current !== pathname) {
      closeAssistant();
    }

    lastPathnameRef.current = pathname;
  }, [pathname]);

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
      if (event.key === "Escape") closeAssistant();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
      if (movingTimerRef.current) window.clearTimeout(movingTimerRef.current);
    };
  }, []);

  if (shouldHide || !launcherPosition) return null;

  return (
    <>
      <style jsx global>{`
        .samass-orb {
          animation: samassOrbFloat 3.8s ease-in-out infinite;
        }

        .samass-magic-trail {
          width: 96px;
          height: 34px;
          transition: opacity 360ms ease;
        }

        .samass-magic-trail .trail-line {
          position: absolute;
          right: 8px;
          top: 50%;
          width: 92px;
          height: 4px;
          transform: translateY(-50%);
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(16, 185, 129, 0.55),
            rgba(167, 243, 208, 0.45),
            rgba(255, 255, 255, 0)
          );
          filter: blur(3px);
          animation: samassTrailFade 1.15s ease-out infinite;
        }

        .samass-magic-trail .spark {
          position: absolute;
          color: rgba(209, 250, 229, 0.95);
          text-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
          animation: samassSpark 1.2s ease-out infinite;
        }

        .spark-1 {
          right: 24px;
          top: 6px;
          font-size: 9px;
        }

        .spark-2 {
          right: 46px;
          top: 18px;
          font-size: 8px;
          animation-delay: 140ms;
        }

        .spark-3 {
          right: 68px;
          top: 9px;
          font-size: 7px;
          animation-delay: 260ms;
        }

        .spark-4 {
          right: 84px;
          top: 22px;
          font-size: 10px;
          animation-delay: 380ms;
        }

        @keyframes samassOrbFloat {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.035);
          }
        }

        @keyframes samassTrailFade {
          0% {
            transform: translateY(-50%) scaleX(0.55);
            opacity: 0;
          }
          35% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-50%) scaleX(1);
            opacity: 0;
          }
        }

        @keyframes samassSpark {
          0% {
            transform: translateX(18px) scale(0.7);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(-18px) translateY(-5px) scale(0.2);
            opacity: 0;
          }
        }
      `}</style>

      {!open ? (
        <button
          type="button"
          onClick={handleLauncherClick}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-label="Ouvrir l'assistant SAMASS"
          className={`group fixed isolate select-none touch-none transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            compact
              ? "z-30"
              : "z-30 rounded-full border border-emerald-500/50 bg-emerald-600/95 px-3 py-2 text-white shadow-[0_12px_28px_rgba(5,150,105,0.22)]"
          } ${dragging ? "cursor-grabbing transition-none" : "cursor-pointer"}`}
          style={{
            left: launcherPosition.x,
            top: launcherPosition.y,
            transform: compact ? "translateY(-50%)" : "translateY(-50%)",
          }}
        >
          {compact ? (
            <span className="relative block">
              <MagicTrail active={moving || dragging} />
              <AssistantOrb compact />
            </span>
          ) : (
            <span className="flex max-w-[205px] items-center gap-2.5">
              <AssistantOrb compact={false} />
              <span className="flex flex-col items-start text-left">
                <span className="text-[12px] font-semibold leading-none">
                  Assistant SAMASS
                </span>
                <span className="mt-1 max-w-[140px] text-[10px] leading-snug text-white/82">
                  Posez-moi vos questions.
                </span>
              </span>
            </span>
          )}
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-sm"
          onClick={closeAssistant}
          role="presentation"
        >
          <div
            className="absolute inset-0 flex items-end justify-end md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="samass-assistant-title"
              className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f6fbf9_0%,#ffffff_100%)] md:h-[min(780px,calc(100dvh-40px))] md:w-[460px] md:rounded-[30px] md:border md:border-white/80 md:shadow-[0_30px_100px_rgba(15,23,42,0.22)]"
            >
              <div className="border-b border-slate-200/80 bg-white/88 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      Assistant SAMASS
                    </p>
                    <h2 id="samass-assistant-title" className="mt-1 text-lg font-semibold text-slate-950">
                      Posez votre question
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Je vous aide à choisir, comprendre et réserver plus sereinement.
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

                <div className="mt-4">
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
                      placeholder="Votre question…"
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
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}