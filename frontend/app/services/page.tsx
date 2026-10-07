"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";
import ReservationButton from "../components/ReservationButton";

const serviceImages: Record<string, string> = {
  "Massage Relaxant Tonique": "/images/relax-massage.jpeg",
  "Massage Tonique": "/images/tonic-massage.jpeg",
  "Massage Tantrique": "/images/samass-room-realistic-2.webp",
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    void getServices().then(setServices).catch(() => setServices([]));
  }, []);

  const displayedServices = useMemo(
    () =>
      [...services].sort((a, b) => {
        if (a.title === "Massage Tantrique") return -1;
        if (b.title === "Massage Tantrique") return 1;
        return 0;
      }),
    [services]
  );

  return (
    <div className="bg-[#0b3f32] text-[#f4f0e8]">
      <section className="min-h-[82svh] px-[5vw] pb-[10vh] pt-[22vh]">
        <p className="samass-kicker text-white/40">MASSAGES · SAMASS</p>
        <h1 className="mt-8 max-w-[1250px] text-[clamp(72px,12vw,185px)] font-extrabold uppercase leading-[.74] tracking-[-.085em]">
          Votre corps.
          <br />
          <span className="ml-[13vw] font-[Georgia] font-normal italic normal-case text-[#d7c5a8]">
            Votre rythme.
          </span>
        </h1>
        <div className="ml-auto mt-16 max-w-xl text-[17px] leading-7 text-white/55">
          Trois approches, aucune séance standardisée. Vous choisissez une
          direction ; le massage s’adapte ensuite à votre état, à vos tensions
          et à ce que vous avez besoin de retrouver.
        </div>
      </section>

      <section className="border-t border-white/15 px-[4vw]">
        {displayedServices.map((service, index) => (
          <article
            key={service.id}
            className="grid gap-8 border-b border-white/15 py-12 lg:grid-cols-[70px_1fr_.75fr]"
          >
            <span className="text-[10px] tracking-[.16em] text-white/30">
              0{index + 1}
            </span>

            <div>
              {service.title === "Massage Tantrique" ? (
                <span className="ritual-featured-label">Le plus demandé</span>
              ) : null}
              <h2 className="max-w-3xl text-[clamp(52px,7vw,105px)] font-bold uppercase leading-[.82] tracking-[-.07em]">
                {service.title.replace("Massage ", "")}
              </h2>
              <p className="mt-8 max-w-xl text-[16px] leading-7 text-white/55">
                {service.description}
              </p>

              <div className="mt-10 grid max-w-xl border-t border-white/15">
                {Object.entries(service.durations_prices).map(
                  ([duration, price]) => (
                    <div
                      key={duration}
                      className="flex items-center justify-between border-b border-white/15 py-4 text-[11px] uppercase tracking-[.14em]"
                    >
                      <span>{duration} minutes</span>
                      <span>{Number(price).toFixed(0)} €</span>
                    </div>
                  )
                )}
              </div>

              {service.long_description && (
                <details className="mt-8 max-w-xl border-b border-white/15 pb-5">
                  <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[.14em] text-white/65">
                    Déroulement de la séance +
                  </summary>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-white/50">
                    {service.long_description
                      .split("\n\n")
                      .map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>{paragraph}</p>
                      ))}
                  </div>
                </details>
              )}

              <div className="mt-8 max-w-sm">
                <ReservationButton serviceId={service.id} />
              </div>
            </div>

            <div className="relative min-h-[52vh] overflow-hidden bg-[#172a23]">
              <Image
                src={
                  service.title === "Massage Tantrique"
                    ? "/images/samass-room-realistic-2.webp"
                    : service.image ||
                      serviceImages[service.title] ||
                      "/images/samass-room-realistic-1.webp"
                }
                alt={service.title}
                fill
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover saturate-[.65]"
              />
            </div>
          </article>
        ))}
      </section>

      <section className="bg-[#e2d8ca] px-[5vw] py-[16vh] text-[#101512]">
        <p className="samass-kicker text-black/45">VOUS HÉSITEZ ?</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <h2 className="text-[clamp(62px,9vw,140px)] font-bold uppercase leading-[.8] tracking-[-.075em]">
            Commencez par
            <br />
            ce que vous
            <br />
            <span className="font-[Georgia] font-normal italic normal-case text-[#356c59]">
              ressentez.
            </span>
          </h2>
          <p className="max-w-md text-lg leading-8 text-black/60">
            Fatigue, stress, tension musculaire, besoin de ralentir ou envie
            d’une expérience plus sensorielle : dites simplement où vous en
            êtes. Sam vous aide à choisir.
          </p>
        </div>
      </section>
    </div>
  );
}
