"use client";

import Image from "next/image";
import Link from "next/link";
import CardService from "./components/CardService";
import ReservationButton from "./components/ReservationButton";
import { useState, useEffect } from "react";

type Service = {
  id: number;
  title: string;
  description: string;
  durations_prices: Record<string, number>;
};

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("https://samass-massage.onrender.com/services/");
        const data = await res.json();
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
      src="/about1.jpg"
      alt="massage"
      fill
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


    
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-forest mb-6">
          Une approche douce & attentive
        </h2>
        <p className="text-softgray max-w-2xl mx-auto leading-relaxed">
          Chez <strong>SAMASS</strong>, chaque massage est une expérience unique.
          Je vous accueille avec douceur, respect et écoute, pour vous offrir un
          moment où votre corps et votre esprit peuvent enfin se relâcher.
        </p>
      </section>

      <section className="bg-pastel py-20 text-center">
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
                  price: price / 100,
                })
              )}
              serviceId={s.id}
            />
          ))}
        </div>
      </section>

      
      <section className="bg-pastel py-20">
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

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-card">
            <p className="text-softgray italic mb-4">
              “Un massage exceptionnel. Un vrai moment de lâcher prise dans un
              cadre apaisant.”
            </p>
            <p className="font-semibold text-forest">— Maxime L.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-card">
            <p className="text-softgray italic mb-4">
              “Très professionnel, à l’écoute et bienveillant. Je suis sortie
              totalement détendue.”
            </p>
            <p className="font-semibold text-forest">— Alex T.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-card">
            <p className="text-softgray italic mb-4">
              “Une expérience unique. On sent une vraie présence et une vraie
              maîtrise des gestes.”
            </p>
            <p className="font-semibold text-forest">— Florian B.</p>
          </div>
        </div>
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
