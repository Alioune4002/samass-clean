"use client";

import { useEffect, useState } from "react";
import CardService from "../components/CardService";

type Service = {
  id: number;
  title: string;
  description: string;
  durations_prices: Record<string, number>;
};

export default function ServicesPage() {
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
      <section className="bg-pastel py-20 text-center">
        <h1 className="text-4xl font-bold text-forest mb-4">Mes Massages</h1>
        <p className="text-softgray max-w-xl mx-auto">
          Des expériences adaptées à votre énergie du moment.
        </p>
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
    </div>
  );
}
