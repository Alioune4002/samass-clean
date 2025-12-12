"use client";

import { useEffect, useState } from "react";
import CardService from "../components/CardService";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";
import Skeleton from "../components/ui/Skeleton";

export default function ServicesPage() {
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

  return (
    <div>
      <section className="bg-pastel py-20 text-center">
        <h1 className="text-4xl font-bold text-forest mb-4">Mes Massages</h1>
        <p className="text-softgray max-w-xl mx-auto">
          Des expériences adaptées à votre énergie du moment.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-emerald-50 bg-white p-5 shadow-sm"
              >
                <Skeleton className="h-6 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
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
            {!services.length && (
              <p className="text-center text-gray-500 col-span-full">
                Aucun service n&apos;est disponible pour le moment.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
