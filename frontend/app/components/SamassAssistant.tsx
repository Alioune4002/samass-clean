"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AssistantResponse,
  resolveAssistantConversation,
  setAssistantServiceCatalog,
} from "@/lib/assistantEngine";
import { getServices } from "@/lib/api";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; response: AssistantResponse };

const guidedQuestions = [
  { label: "Je découvre le tantrique", query: "Je suis curieux du massage tantrique, à quoi m’attendre ?" },
  { label: "Aide-moi à choisir", query: "Je ne sais pas quel massage choisir, peux-tu m’aider ?" },
  { label: "J’ai des tensions", query: "Quel massage choisir pour les tensions et la fatigue musculaire ?" },
  { label: "Tarifs & durées", query: "Quels sont les tarifs et les durées des massages ?" },
];

function welcomeResponse(): AssistantResponse {
  return {
    type: "knowledge",
    title: "Votre guide SAMASS",
    shortAnswer:
      "Expliquez-moi ce que vous recherchez avec vos propres mots. Je garde le fil de la conversation et je peux vous orienter vers le massage le plus cohérent, notamment le tantrique, expliquer le cadre, les tarifs, les durées ou la prise de rendez-vous.",
    longAnswer: [],
    links: [],
    suggestions: guidedQuestions.map((item) => item.label),
    matches: [],
  };
}

export default function SamassAssistant() {
  const pathname = usePathname();
  const shouldHide =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/admin-samass-98342");

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", response: welcomeResponse() },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void getServices()
      .then((services) => {
        if (active) setAssistantServiceCatalog(services);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, responding, open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const latestResponse = useMemo(() => {
    return [...messages]
      .reverse()
      .find(
        (message): message is Extract<Message, { role: "assistant" }> =>
          message.role === "assistant"
      )?.response;
  }, [messages]);

  function ask(question: string) {
    const value = question.trim();
    if (!value || responding) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: value },
    ]);
    setInput("");
    setResponding(true);
    setOpen(true);

    const history = messages.map((message) =>
      message.role === "user"
        ? { role: "user" as const, text: message.text }
        : {
            role: "assistant" as const,
            text:
              message.response.title +
              " — " +
              message.response.shortAnswer +
              " " +
              message.response.longAnswer.join(" "),
          }
    );

    window.setTimeout(() => {
      const response = resolveAssistantConversation(value, history);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          response,
        },
      ]);
      setResponding(false);
    }, 220);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  if (shouldHide) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="ritual-assistant-launcher"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le guide SAMASS"
        >
          <span className="ritual-assistant-symbol" aria-hidden="true">
            <i />
            <i />
          </span>
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
            className="ritual-assistant-backdrop"
            onClick={() => setOpen(false)}
          />

          <section
            className="ritual-assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Guide SAMASS"
          >
            <header className="ritual-assistant-head">
              <div className="ritual-assistant-head-title">
                <span className="ritual-assistant-symbol" aria-hidden="true">
                  <i />
                  <i />
                </span>
                <div>
                  <p>Guide SAMASS</p>
                  <small>Choisir sans jargon, à votre rythme.</small>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                Fermer
              </button>
            </header>

            <div className="ritual-assistant-thread" ref={scrollRef}>
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="ritual-assistant-user">
                      {message.text}
                    </div>
                  );
                }

                const response = message.response;
                return (
                  <article key={message.id} className="ritual-assistant-answer">
                    <p className="ritual-assistant-label">{response.title}</p>
                    <p className="ritual-assistant-main">
                      {response.shortAnswer}
                    </p>

                    {response.longAnswer.length ? (
                      <div className="ritual-assistant-detail">
                        {response.longAnswer.slice(0, 3).map((paragraph, index) => (
                          <p key={`${message.id}-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                    ) : null}

                    {response.links.length ? (
                      <div className="ritual-assistant-links">
                        {response.links.slice(0, 3).map((link) => (
                          <Link
                            key={`${message.id}-${link.href}-${link.label}`}
                            href={link.href}
                            onClick={() => setOpen(false)}
                          >
                            {link.label} <span>↗</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}

              {responding ? (
                <div className="ritual-assistant-thinking">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}

              <div className="ritual-assistant-guides">
                <p>Vous pouvez commencer par :</p>
                <div>
                  {guidedQuestions.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => ask(item.query)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {latestResponse?.suggestions?.length ? (
                <div className="ritual-assistant-followups">
                  {latestResponse.suggestions.slice(0, 3).map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => ask(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <form className="ritual-assistant-form" onSubmit={submit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={1}
                placeholder="Écrivez comme vous parleriez à Sam…"
                aria-label="Votre question"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ask(input);
                  }
                }}
              />
              <button type="submit" disabled={!input.trim() || responding}>
                Envoyer
              </button>
            </form>

            <p className="ritual-assistant-footnote">
              Ce guide répond sur les prestations SAMASS. Pour une situation
              particulière, Sam reste disponible directement.
            </p>
          </section>
        </>
      ) : null}
    </>
  );
}
