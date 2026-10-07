"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ReservationModal from "../components/ReservationModal";
import { getServices } from "@/lib/api";
import { Service } from "@/lib/types";

export default function Reservation() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  useEffect(() => {
    void getServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
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

  const openModal = (serviceId?: number) => {
    setSelectedServiceId(serviceId ?? null);
    setModalOpen(true);
  };

  return (
    <div className="ritual-reservation-page">
      <section className="ritual-reservation-hero">
        <div>
          <p className="ritual-eyebrow">RENDEZ-VOUS · SAMASS</p>
          <h1>
            Proposez
            <br />
            votre <em>moment.</em>
          </h1>
          <p>
            Choisissez une expérience, une durée et l’horaire qui vous conviendrait.
            Sam confirme ensuite personnellement le rendez-vous.
          </p>
          <button onClick={() => openModal()} className="ritual-primary-link">
            Faire une demande <span>↗</span>
          </button>
        </div>
        <div className="ritual-reservation-hero-media">
          <Image src="/images/samass-room-realistic-1.webp" alt="Espace SAMASS" fill priority sizes="(max-width: 900px) 100vw, 48vw" className="object-cover" />
        </div>
      </section>

      <section className="ritual-reservation-services">
        <div className="ritual-reservation-heading">
          <p className="ritual-eyebrow">CHOISIR UNE DIRECTION</p>
          <h2>Trois approches. Votre rythme.</h2>
          <p>Le massage tantrique est l’expérience la plus demandée chez SAMASS.</p>
        </div>
        {loading ? (
          <p className="ritual-loading">Chargement des massages…</p>
        ) : (
          <div className="ritual-reservation-list">
            {displayedServices.map((service, index) => (
              <article key={service.id} className="ritual-reservation-service">
                <span className="ritual-service-index">0{index + 1}</span>
                <div>
                  {service.title === "Massage Tantrique" ? <span className="ritual-featured-label dark">Le plus demandé</span> : null}
                  <h3>{service.title.replace("Massage ", "")}</h3>
                  <p>{service.description}</p>
                </div>
                <button type="button" onClick={() => openModal(service.id)}>
                  Demander ce massage
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialServiceId={selectedServiceId}
      />
    </div>
  );
}
