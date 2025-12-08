"use client";

import Image from "next/image";
import Link from "next/link";
import CardService from "./components/CardService";
import ReservationButton from "./components/ReservationButton";
import { useState, useEffect } from "react";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";
import useInterval from "./components/useInterval";
import useInterval from "./components/useInterval";

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getServices();
        setServices(data);
      } catch (e) {
        console.error("Erreur chargement services :", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p className="text-center py-20">Chargement…</p>;

  return (
    <div>
      <section className="relative bg-pastel pt-32 pb-20">

  
  <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden hidden md:block">
    <Image
      src="/images/about1.jpg"
      alt="massage"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover object-right blur-md opacity-60 brightness-110"
    />
  </div>

  <div className="max-w-7xl mx-auto px-6 relative z-10">
    <h1 className="text-4xl md:text-5xl font-bold text-forest max-w-xl leading-tight">
      Reconnectez-vous à votre corps.
    </h1>

    <p className="text-softgray text-lg max-w-lg mt-4">
      Massages relaxants, toniques ou tantriques, une expérience douce,
      humaine et personnalisée, pensée pour vous offrir un vrai moment de
      présence et de détente à Quimper.
    </p>

    <Link
      href="/services"
      className="inline-block bg-forest text-white mt-8 px-6 py-3 rounded-xl hover:bg-leaf transition"
    >
      Découvrir mes massages
    </Link>
  </div>
</section>


    
      <section className="max-w-5xl mx-auto px-6 py-20 text-center bg-gradient-to-b from-emerald-50 to-white rounded-3xl shadow-sm">
        <h2 className="text-3xl font-bold text-forest mb-6">
          Une approche douce & attentive
        </h2>
        <p className="text-softgray max-w-2xl mx-auto leading-relaxed">
          Chez <strong>SAMASS</strong>, chaque massage est une expérience unique.
          Je vous accueille avec douceur, respect et écoute, pour vous offrir un
          moment où votre corps et votre esprit peuvent enfin se relâcher.
        </p>
      </section>

      <section className="bg-gradient-to-b from-white to-emerald-50 py-20 text-center">
        <h1 className="text-4xl font-bold text-forest mb-4">Mes Massages</h1>
       
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <CardService
              key={s.id}
              title={s.title}
              description={s.description}
              formulas={Object.entries(s.durations_prices).map(
                ([duration, price]) => ({
                  duration: duration + " min",
                  price,
                })
              )}
              serviceId={s.id}
            />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 bg-white border border-emerald-50 rounded-3xl shadow-sm">
        <h2 className="text-2xl font-bold text-forest mb-4">
          Massages à Quimper et dans le Finistère
        </h2>
        <p className="text-softgray leading-relaxed">
          Basé à Quimper, j&apos;accompagne les habitants du Finistère pour des
          massages relaxants, toniques ou tantriques. Chaque séance est
          personnalisée : choix de la pression, du rythme et de la durée (60 à
          90 minutes) pour répondre à vos besoins. Que vous cherchiez un massage
          bien-être après le travail, une récupération musculaire ou une
          expérience plus énergétique, je construis la séance sur-mesure.
        </p>
        <p className="text-softgray leading-relaxed mt-3">
          Réservez votre massage à Quimper ou contactez-moi pour préparer un
          créneau : je reste disponible pour conseiller la formule adaptée
          (relaxant, tonique ou tantrique) et la durée idéale selon vos tensions
          ou objectifs.
        </p>
      </section>

      
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-forest mb-10">
            Pourquoi choisir Samass ?
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="font-semibold text-xl text-forest mb-2">
                Présence & douceur
              </h3>
              <p className="text-softgray text-sm">
                Une approche humaine et intuitive, adaptée à votre énergie et
                vos besoins du moment.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🤲</div>
              <h3 className="font-semibold text-xl text-forest mb-2">
                Un espace sécurisant
              </h3>
              <p className="text-softgray text-sm">
                Bienveillance, écoute et respect pour un moment où vous pouvez
                vraiment vous relâcher.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-semibold text-xl text-forest mb-2">
                Massages personnalisés
              </h3>
              <p className="text-softgray text-sm">
                Aucun protocole rigide : je m’adapte à vos tensions, votre
                respiration et vos émotions.
              </p>
            </div>
          </div>
        </div>
      </section>



      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-forest mb-12">
          Ils ont aimé leur séance
        </h2>

        <TestimonialCarousel />
      </section>

     
      <section className="bg-forest py-20 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Offrez-vous un vrai moment pour vous
        </h2>
        <p className="opacity-80 mb-6">
          Massage relaxant, tonique ou tantrique selon vos besoins du moment.
        </p>
        <ReservationButton />
      </section>
    </div>
  );
}

function TestimonialCarousel() {
  const slides = [
    {
      text: "Un massage exceptionnel. Un vrai moment de lâcher prise dans un cadre apaisant.",
      author: "Maxime L.",
    },
    {
      text: "Très professionnel, à l’écoute et bienveillant. Je suis sorti totalement détendu.",
      author: "Alex T.",
    },
    {
      text: "Une expérience unique. On sent une vraie présence et une vraie maîtrise des gestes.",
      author: "Florian B.",
    },
    {
      text: "Sammy sait exactement adapter la pression et le rythme. J'ai enfin retrouvé de la mobilité.",
      author: "Julien R.",
    },
    {
      text: "Cadre rassurant, écoute totale. C'est devenu mon rendez-vous mensuel pour souffler.",
      author: "Nicolas P.",
    },
    {
      text: "Massage tonique bluffant : récupération express après mes séances de sport.",
      author: "Hugo M.",
    },
  ];

  const [index, setIndex] = useState(0);
  useInterval(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, 5000);

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-700"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={i} className="min-w-full px-4 md:px-6">
            <div className="p-6 bg-white rounded-xl shadow-card max-w-3xl mx-auto text-center">
              <p className="text-softgray italic mb-4">{s.text}</p>
              <p className="font-semibold text-forest">— {s.author}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${
              index === i ? "bg-forest" : "bg-gray-300"
            }`}
            aria-label={`Aller au témoignage ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
