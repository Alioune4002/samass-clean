"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type AssistantAction = {
  label: string;
  href: "/services" | "/reservation" | "/contact";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  action?: AssistantAction | null;
  time: string;
};

const starterSuggestions = [
  "Je découvre le tantrique",
  "Aide-moi à choisir",
  "Que dois-je prévoir avant de venir ?",
  "Quels sont les tarifs ?",
];

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis le Guide SAMASS. Je peux vous aider à choisir le massage qui vous correspond, vous expliquer le déroulement, les tarifs ou encore vous préparer pour votre rendez-vous. Comment puis-je vous aider aujourd’hui ?",
  suggestions: starterSuggestions,
  action: null,
  time: "",
};

function nowLabel() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LotusMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={small ? "samass-lotus is-small" : "samass-lotus"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M32 48C22 40 18 31 32 13C46 31 42 40 32 48Z" />
        <path d="M29 49C18 49 10 43 8 32C20 31 28 36 32 46" />
        <path d="M35 49C46 49 54 43 56 32C44 31 36 36 32 46" />
        <path d="M27 48C18 44 14 36 16 25C24 27 29 34 32 44" />
        <path d="M37 48C46 44 50 36 48 25C40 27 35 34 32 44" />
      </svg>
    </span>
  );
}

export default function SamassAssistant() {
  const pathname = usePathname();
  const shouldHide =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/admin-samass-98342");

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("samass-guide-thread");
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-24));
        }
      }
    } catch {
      // Une session corrompue ne doit jamais casser le guide.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        "samass-guide-thread",
        JSON.stringify(messages.slice(-24))
      );
    } catch {
      // Le chat reste utilisable même si sessionStorage est indisponible.
    }
  }, [messages, hydrated]);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [messages, responding, open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const latestAssistant = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant"),
    [messages]
  );

  async function ask(question: string) {
    const value = question.trim();
    if (!value || responding) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: value,
      time: nowLabel(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setResponding(true);
    setOpen(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Assistant HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        answer?: string;
        suggestions?: string[];
        action?: AssistantAction | null;
      };

      const answer =
        typeof payload.answer === "string" && payload.answer.trim()
          ? payload.answer.trim()
          : "Je n’ai pas réussi à répondre correctement. Pouvez-vous reformuler ?";

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          suggestions: Array.isArray(payload.suggestions)
            ? payload.suggestions.slice(0, 3)
            : [],
          action: payload.action ?? null,
          time: nowLabel(),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "Je rencontre un petit problème de connexion. Réessayez dans quelques instants ; si votre demande est urgente, vous pouvez écrire directement à Sam.",
          suggestions: [],
          action: { label: "Contacter Sam", href: "/contact" },
          time: nowLabel(),
        },
      ]);
    } finally {
      setResponding(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  if (shouldHide) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="ritual-assistant-launcher assistant-v3-launcher"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le Guide SAMASS"
        >
          <LotusMark small />
          <span>
            <strong>Besoin d’aide pour choisir ?</strong>
            <small>Guide SAMASS</small>
          </span>
        </button>
      ) : null}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer le guide"
            className="ritual-assistant-backdrop assistant-v3-backdrop"
            onClick={() => setOpen(false)}
          />

          <section
            className="assistant-v3-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Guide SAMASS"
          >
            <header className="assistant-v3-header">
              <div className="assistant-v3-identity">
                <LotusMark />
                <div>
                  <h2>Guide SAMASS</h2>
                  <p>Assistant bien-être à votre écoute</p>
                </div>
              </div>

              <button
                type="button"
                className="assistant-v3-close"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">×</span>
                Fermer
              </button>
            </header>

            <div className="assistant-v3-thread" ref={scrollRef}>
              {messages.map((message) =>
                message.role === "assistant" ? (
                  <div
                    key={message.id}
                    className="assistant-v3-row assistant-v3-row-assistant"
                  >
                    <LotusMark small />
                    <div className="assistant-v3-stack">
                      <div className="assistant-v3-bubble assistant-v3-assistant-bubble">
                        <p>{message.content}</p>
                      </div>
                      {message.time ? (
                        <time className="assistant-v3-time">{message.time}</time>
                      ) : null}

                      {message.id === latestAssistant?.id &&
                      message.action ? (
                        <Link
                          href={message.action.href}
                          className="assistant-v3-action"
                          onClick={() => setOpen(false)}
                        >
                          {message.action.label} <span>↗</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className="assistant-v3-row assistant-v3-row-user"
                  >
                    <div className="assistant-v3-stack">
                      <div className="assistant-v3-bubble assistant-v3-user-bubble">
                        <p>{message.content}</p>
                      </div>
                      <time className="assistant-v3-time assistant-v3-user-time">
                        {message.time}
                        <span aria-hidden="true">✓✓</span>
                      </time>
                    </div>
                  </div>
                )
              )}

              {responding ? (
                <div className="assistant-v3-row assistant-v3-row-assistant">
                  <LotusMark small />
                  <div className="assistant-v3-thinking" aria-label="Réponse en cours">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}

              {!responding && latestAssistant?.suggestions?.length ? (
                <div className="assistant-v3-suggestions">
                  {latestAssistant.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void ask(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <form className="assistant-v3-compose" onSubmit={submit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={1}
                maxLength={1600}
                placeholder="Écrivez votre message…"
                aria-label="Votre message"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask(input);
                  }
                }}
              />
              <button
                type="submit"
                className="assistant-v3-send"
                disabled={!input.trim() || responding}
              >
                Envoyer
                <span aria-hidden="true">➤</span>
              </button>
            </form>
          </section>
        </>
      ) : null}
    </>
  );
}
