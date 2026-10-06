"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";
import ReservationButton from "./components/ReservationButton";

type NeedKey = "calm" | "tension" | "energy" | "sensation";

const needs: Array<{
  key: NeedKey;
  label: string;
  prompt: string;
  target: string;
  reason: string;
}> = [
  {
    key: "calm",
    label: "J’ai besoin de ralentir",
    prompt: "Mental chargé, fatigue nerveuse, besoin de souffler.",
    target: "Massage Relaxant Tonique",
    reason:
      "Un bon point d’entrée pour relâcher la pression tout en gardant une sensation de fluidité et d’ancrage.",
  },
  {
    key: "tension",
    label: "Je suis tendu·e",
    prompt: "Dos, épaules, jambes ou fatigue musculaire.",
    target: "Massage Tonique",
    reason:
      "Une approche plus appuyée, pensée pour travailler les zones qui ont accumulé de la tension.",
  },
  {
    key: "energy",
    label: "Je veux retrouver de l’énergie",
    prompt: "Corps lourd, baisse de tonus, besoin de relance.",
    target: "Massage Tonique",
    reason:
      "Le rythme plus dynamique aide à retrouver une sensation de mouvement, de circulation et d’élan.",
  },
  {
    key: "sensation",
    label: "Je veux me reconnecter",
    prompt: "Besoin de lenteur, de présence et de sensations.",
    target: "Massage Tantrique",
    reason:
      "Une expérience plus lente et sensorielle, centrée sur la présence au corps et le ressenti du moment.",
  },
];

const serviceImages: Record<string, string> = {
  "Massage Relaxant Tonique": "/images/relax-massage.jpeg",
  "Massage Tonique": "/images/tonic-massage.jpeg",
  "Massage Tantrique": "/images/tantric-massage.jpeg",
};

const notes = [
  {
    text: "J’ai senti que la séance s’adaptait vraiment à moi, pas l’inverse.",
    author: "Maxime",
  },
  {
    text: "Le plus marquant, c’est la sensation de calme qui reste après.",
    author: "Alex",
  },
  {
    text: "Simple, rassurant, très humain. Je suis reparti beaucoup plus léger.",
    author: "Florian",
  },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<NeedKey>("calm");

  useEffect(() => {
    void getServices().then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-ritual-reveal]")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const need = needs.find((item) => item.key === selectedNeed) ?? needs[0];

  const recommendedService = useMemo(
    () => services.find((service) => service.title === need.target) ?? null,
    [need.target, services]
  );

  return (
    <div className="ritual-site">
      <section className="ritual-hero">
        <div className="ritual-hero-photo">
          <Image
            src="/images/about1.jpg"
            alt="Atmosphère SAMASS"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="ritual-hero-photo-shade" />
        </div>

        <div className="ritual-hero-card">
          <p className="ritual-eyebrow">SAMASS · MASSAGE À QUIMPER</p>
          <h1>
            Un moment où
            <br />
            personne ne vous
            <br />
            demande rien.
          </h1>
          <p className="ritual-hero-intro">
            Une parenthèse simple, chaude et sur-mesure pour laisser le corps
            redescendre à son propre rythme.
          </p>

          <div className="ritual-hero-actions">
            <Link href="/reservation" className="ritual-primary-link">
              Demander un rendez-vous
              <span>↗</span>
            </Link>
            <Link href="/services" className="ritual-quiet-link">
              Voir les massages
            </Link>
          </div>
        </div>

        <div className="ritual-hero-caption">
          <span>Quimper · Finistère</span>
          <span>Sur rendez-vous</span>
        </div>
      </section>

      <section className="ritual-needs" data-ritual-reveal>
        <div className="ritual-section-intro">
          <p className="ritual-eyebrow">COMMENCER PAR VOUS</p>
          <h2>Comment arrive votre corps aujourd’hui&nbsp;?</h2>
          <p>
            Pas besoin de connaître les techniques. Commencez simplement par
            ce que vous ressentez.
          </p>
        </div>

        <div className="ritual-needs-layout">
          <div className="ritual-need-picker" role="tablist" aria-label="Votre besoin">
            {needs.map((item) => {
              const active = item.key === selectedNeed;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedNeed(item.key)}
                  className={active ? "is-active" : ""}
                >
                  <span className="ritual-need-dot" />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.prompt}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ritual-recommendation">
            <div className="ritual-breath-mark" aria-hidden="true">
              <span />
              <span />
            </div>
            <p className="ritual-eyebrow">ORIENTATION SAMASS</p>
            <h3>{recommendedService?.title ?? need.target}</h3>
            <p>{need.reason}</p>

            {recommendedService ? (
              <>
                <div className="ritual-price-line">
                  {Object.entries(recommendedService.durations_prices).map(
                    ([duration, price]) => (
                      <span key={duration}>
                        {duration} min · {Number(price).toFixed(0)} €
                      </span>
                    )
                  )}
                </div>
                <ReservationButton serviceId={recommendedService.id} />
              </>
            ) : (
              <Link href="/services" className="ritual-primary-link dark">
                Découvrir ce massage <span>↗</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="ritual-massages" data-ritual-reveal>
        <div className="ritual-section-intro ritual-section-intro-light">
          <p className="ritual-eyebrow">LES MASSAGES</p>
          <h2>Une intention avant une technique.</h2>
          <p>
            La séance commence par une direction, puis elle évolue selon votre
            corps, vos réactions et votre niveau de confort.
          </p>
        </div>

        <div className="ritual-massage-cards">
          {services.map((service) => (
            <article key={service.id} className="ritual-massage-card">
              <div className="ritual-massage-image">
                <Image
                  src={
                    service.image ||
                    serviceImages[service.title] ||
                    "/images/about3.png"
                  }
                  alt={service.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              <div className="ritual-massage-copy">
                <h3>{service.title.replace("Massage ", "")}</h3>
                <p>{service.description}</p>

                <div className="ritual-price-line">
                  {Object.entries(service.durations_prices).map(
                    ([duration, price]) => (
                      <span key={duration}>
                        {duration} min · {Number(price).toFixed(0)} €
                      </span>
                    )
                  )}
                </div>

                <ReservationButton serviceId={service.id} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ritual-session" data-ritual-reveal>
        <div className="ritual-session-copy">
          <p className="ritual-eyebrow">LE RITUEL</p>
          <h2>La séance prend le temps qu’il faut pour commencer.</h2>
          <p>
            Vous n’arrivez pas sur une table avec un protocole déjà décidé.
            Quelques minutes suffisent pour comprendre votre besoin et poser
            un cadre clair.
          </p>
        </div>

        <div className="ritual-steps">
          {[
            ["On échange", "Besoin du moment, zones de tension, intensité souhaitée."],
            ["Le corps guide", "Le rythme et la pression évoluent selon vos sensations."],
            ["On redescend", "La séance se termine doucement pour laisser le corps revenir."],
          ].map(([title, text], index) => (
            <article key={title}>
              <div className="ritual-step-pulse">
                <span>{index + 1}</span>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ritual-place" data-ritual-reveal>
        <div className="ritual-place-images">
          <div className="ritual-place-main">
            <Image
              src="/images/about3.png"
              alt="Espace de massage SAMASS"
              fill
              sizes="(max-width: 900px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
          <div className="ritual-place-detail">
            <Image
              src="/images/about1.jpg"
              alt="Détail de l’espace SAMASS"
              fill
              sizes="(max-width: 900px) 45vw, 26vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="ritual-place-copy">
          <p className="ritual-eyebrow">LE LIEU</p>
          <h2>Un espace simple, préparé pour ralentir.</h2>
          <p>
            Lumière douce, linge propre, chaleur, calme. Rien de spectaculaire :
            juste ce qu’il faut pour que le reste puisse se mettre en retrait.
          </p>
          <Link href="/about" className="ritual-quiet-link dark">
            Découvrir l’approche
          </Link>
        </div>
      </section>

      <section className="ritual-notes" data-ritual-reveal>
        <div className="ritual-section-intro">
          <p className="ritual-eyebrow">APRÈS LA SÉANCE</p>
          <h2>Quelques mots laissés en repartant.</h2>
        </div>

        <div className="ritual-note-grid">
          {notes.map((note) => (
            <article key={note.author}>
              <span className="ritual-note-mark">“</span>
              <p>{note.text}</p>
              <small>{note.author}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="ritual-closing" data-ritual-reveal>
        <div className="ritual-closing-card">
          <div className="ritual-breath-mark large" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="ritual-eyebrow">QUAND VOUS ÊTES PRÊT·E</p>
          <h2>Le prochain rendez-vous peut simplement commencer par une demande.</h2>
          <p>
            Vous choisissez le massage, la durée et l’horaire qui vous
            conviendrait. Sam vous répond ensuite personnellement.
          </p>
          <Link href="/reservation" className="ritual-primary-link">
            Demander un rendez-vous <span>↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
