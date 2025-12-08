'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReservationModal from '../components/ReservationModal';
import { getServices } from '@/lib/api';
import { Service } from '@/lib/types';

export default function Reservation() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Erreur chargement services:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const openModal = (serviceId?: number) => {
    setSelectedServiceId(serviceId ?? null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-gray-900">
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-16 text-center">
        <motion.h1
          className="text-3xl md:text-5xl font-bold text-emerald-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Réservez votre prochain massage
        </motion.h1>
        <motion.p
          className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Choisissez le massage, la date et le créneau qui vous conviennent.
          La demande est envoyée instantanément et confirmée par email.
        </motion.p>
        <button
          onClick={() => openModal()}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-6 py-3 text-base font-semibold shadow-lg hover:bg-emerald-700 transition"
        >
          Ouvrir le planning
        </button>
      </section>

      <section className="bg-white border-t border-emerald-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-900">
                Massages disponibles
              </h2>
              <p className="text-gray-600 text-sm">
                Cliquez sur «Réserver» pour pré-sélectionner le massage.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="md:inline-flex hidden rounded-full border border-emerald-200 text-emerald-800 px-4 py-2 text-sm font-medium hover:border-emerald-400"
            >
              Voir les créneaux
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Chargement des massages…</p>
          ) : services.length === 0 ? (
            <p className="text-gray-500">
              Aucun massage n&apos;est disponible pour le moment.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-emerald-50 bg-gradient-to-b from-white to-emerald-50/50 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-emerald-900">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {service.description}
                      </p>
                    </div>
                    <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-semibold">
                      Massage
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-700">
                    {Object.entries(service.durations_prices).map(
                      ([duration, price]) => (
                        <div
                          key={duration}
                          className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-3 py-2"
                        >
                          <span>{duration} min</span>
                          <span className="font-semibold">
                            {Number(price).toFixed(2)} €
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => openModal(service.id)}
                      className="flex-1 min-w-[160px] inline-flex justify-center rounded-full bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold shadow hover:bg-emerald-700 transition"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialServiceId={selectedServiceId}
      />
    </div>
  );
}
