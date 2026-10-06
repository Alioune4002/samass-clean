"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";
import ReservationButton from "./components/ReservationButton";

const serviceImages: Record<string, string> = {
  "Massage Relaxant Tonique": "/images/relax-massage.jpeg",
  "Massage Tonique": "/images/tonic-massage.jpeg",
  "Massage Tantrique": "/images/tantric-massage.jpeg",
};

const testimonials = [
  {
    quote:
      "On ne vient pas seulement chercher un massage. On repart avec la sensation d’avoir enfin ralenti.",
    author: "Maxime L.",
  },
  {
    quote:
      "Présence, écoute, précision. La séance s’adapte vraiment à ce que le corps demande ce jour-là.",
    author: "Alex T.",
  },
  {
    quote:
      "Une expérience très différente des massages standardisés. Ici, on sent qu’il y a une vraie attention.",
    author: "Florian B.",
  },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    void getServices().then(setServices).catch(() => setServices([]));
  }, []);

  return (
    <div className="samass-site">
      <section className="samass-hero">
        <div className="samass-hero-media" aria-hidden="true">
          <Image
            src="/images/about1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="samass-hero-overlay" />
        </div>

        <div className="samass-hero-grain" aria-hidden="true" />

        <div className="samass-hero-copy">
          <p className="samass-kicker">MASSAGE · QUIMPER · SUR-MESURE</p>
          <h1>
            Revenir
            <span>à soi.</span>
          </h1>

          <div className="samass-hero-bottom">
            <p>
              Un espace pour relâcher le bruit, retrouver ses sensations et
              laisser le corps reprendre sa place.
            </p>
            <Link href="/reservation" className="samass-arrow-link">
              Demander un rendez-vous <span>↗</span>
            </Link>
          </div>
        </div>

        <div className="samass-hero-mark" aria-hidden="true">
          S
        </div>

        <div className="samass-scroll-note">DÉFILER ↓</div>
      </section>

      <section className="samass-manifesto">
        <p className="samass-kicker">L’INTENTION</p>
        <div>
          <p>
            LE CORPS N’A PAS TOUJOURS BESOIN
            <br />
            QU’ON LUI EN DEMANDE <span>PLUS.</span>
          </p>
          <p className="samass-manifesto-shift">
            PARFOIS, IL A BESOIN
            <br />
            QU’ON L’ÉCOUTE <em>MIEUX.</em>
          </p>
        </div>
      </section>

      <section className="samass-services">
        <header className="samass-section-head">
          <p className="samass-kicker">LES MASSAGES</p>
          <div>
            <h2>
              Trois façons
              <br />
              de <em>revenir.</em>
            </h2>
            <p>
              Pas de protocole figé. Le rythme, la pression et l’intention se
              construisent selon votre état du moment.
            </p>
          </div>
        </header>

        <div className="samass-service-list">
          {(services.length ? services : []).map((service, index) => (
            <article key={service.id} className="samass-service-row">
              <div className="samass-service-index">0{index + 1}</div>

              <div className="samass-service-title">
                <h3>{service.title.replace("Massage ", "")}</h3>
                <p>{service.description}</p>
              </div>

              <div className="samass-service-visual">
                <Image
                  src={
                    service.image ||
                    serviceImages[service.title] ||
                    "/images/about3.png"
                  }
                  alt={service.title}
                  fill
                  sizes="(max-width: 800px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>

              <div className="samass-service-meta">
                <div>
                  {Object.entries(service.durations_prices).map(
                    ([duration, price]) => (
                      <span key={duration}>
                        {duration} MIN · {Number(price).toFixed(0)} €
                      </span>
                    )
                  )}
                </div>
                <ReservationButton serviceId={service.id} />
              </div>
            </article>
          ))}

          {!services.length && (
            <>
              {[
                ["Relaxant Tonique", "Douceur, respiration et relance."],
                ["Tonique", "Travail plus profond et énergie retrouvée."],
                ["Tantrique", "Présence, lenteur et reconnexion sensorielle."],
              ].map(([title, description], index) => (
                <article key={title} className="samass-service-row is-loading">
                  <div className="samass-service-index">0{index + 1}</div>
                  <div className="samass-service-title">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="samass-experience">
        <div className="samass-experience-image">
          <Image
            src="/images/about3.png"
            alt="Atmosphère SAMASS"
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            className="object-cover"
          />
        </div>

        <div className="samass-experience-copy">
          <p className="samass-kicker">UNE SÉANCE CHEZ SAMASS</p>
          <h2>
            Rien à
            <br />
            <em>performer.</em>
          </h2>
          <p>
            Vous arrivez comme vous êtes. On commence par quelques minutes
            d’échange pour comprendre ce dont vous avez besoin, puis la séance
            se construit autour de votre respiration, de vos tensions et de
            votre rythme.
          </p>

          <div className="samass-experience-points">
            <span>01 · ÉCHANGE</span>
            <span>02 · ÉCOUTE DU CORPS</span>
            <span>03 · MASSAGE SUR-MESURE</span>
            <span>04 · RETOUR AU CALME</span>
          </div>
        </div>
      </section>

      <section className="samass-quote">
        <p className="samass-kicker">L’APPROCHE</p>
        <blockquote>
          « Le bon massage n’impose rien.
          <br />
          Il crée l’espace pour que le corps
          <br />
          <em>cesse enfin de résister.</em> »
        </blockquote>
        <div className="samass-signature">
          <span>SAM</span>
          <p>Présence · écoute · adaptation</p>
        </div>
      </section>

      <section className="samass-testimonials">
        <header>
          <p className="samass-kicker">ILS SONT VENUS POUR SOUFFLER</p>
          <h2>
            Ce qu’ils
            <br />
            en <em>gardent.</em>
          </h2>
        </header>

        <div className="samass-testimonial-grid">
          {testimonials.map((item, index) => (
            <article key={item.author}>
              <span>0{index + 1}</span>
              <p>“{item.quote}”</p>
              <strong>{item.author}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="samass-local">
        <div>
          <p className="samass-kicker">QUIMPER · FINISTÈRE</p>
          <h2>
            Un lieu pour
            <br />
            disparaître
            <br />
            <em>un instant.</em>
          </h2>
        </div>
        <div className="samass-local-copy">
          <p>
            Une séance SAMASS n’est pas pensée comme une case de plus dans
            votre journée. C’est une coupure nette, un moment protégé, sans
            pression ni performance.
          </p>
          <Link href="/about" className="samass-text-link">
            Découvrir l’approche ↗
          </Link>
        </div>
      </section>

      <section className="samass-final-cta">
        <p className="samass-kicker">PRENDRE LE TEMPS</p>
        <h2>
          Et si votre
          <br />
          prochain rendez-vous
          <br />
          était avec <em>vous-même ?</em>
        </h2>
        <div>
          <Link href="/reservation" className="samass-arrow-link light">
            Demander un rendez-vous <span>↗</span>
          </Link>
          <Link href="/contact" className="samass-text-link light">
            Poser une question
          </Link>
        </div>
      </section>
    </div>
  );
}
