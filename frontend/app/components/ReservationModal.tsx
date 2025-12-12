"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBooking, getAvailabilities, getServices } from "../../lib/api";
import { Availability, Service } from "@/lib/types";
import Skeleton from "./ui/Skeleton";

const timeOptions: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "2-digit",
  month: "long",
};

const toLocalDate = (iso: string) => {
  const [datePart, timePart] = iso.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

const formatLocalISO = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const formatTime = (iso: string) => {
  return toLocalDate(iso).toLocaleTimeString("fr-FR", timeOptions);
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: number | null; 
};

export default function ReservationModal({ isOpen, onClose, initialServiceId }: Props) {

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [timeSlots, setTimeSlots] = useState<
    { availabilityId: number; start: string }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    availabilityId: number;
    start: string;
  } | null>(null);
  const [availableDates, setAvailableDates] = useState<
    { value: string; label: string }[]
  >([]);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  
  
  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      try {
        setLoadingServices(true);
        const data = await getServices();
        setServices(data);

        if (initialServiceId) {
          const found = data.find(
            (s: Service) => s.id === initialServiceId
          );
          if (found) {
            setSelectedService(found);
            const firstDuration = Object.keys(found.durations_prices || {})[0];
            setSelectedDuration(firstDuration ? Number(firstDuration) : null);
          }
        }
        await refreshAvailableDates();
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingServices(false);
      }
    }
    resetState();
    load();
  }, [isOpen, initialServiceId]);


  function resetState() {
    setStep(1);
    setSelectedService(null);
    setSelectedDuration(null);
    setSelectedDate("");
    setAvailabilities([]);
    setTimeSlots([]);
    setSelectedSlot(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setApiError(null);
  }

  
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    return { value: iso, label };
  });

  async function handleSelectDate(date: string) {
    if (!selectedService || !selectedDuration) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setApiError(null);
    setLoadingSlots(true);

    try {
      const data = await getAvailabilities();
      const now = new Date();
      const filtered = data
        .filter((a) => a.start_datetime.slice(0, 10) === date)
        .filter((a) => {
          const slotMinutes =
            (new Date(a.end_datetime).getTime() -
              new Date(a.start_datetime).getTime()) /
            60000;
          return (
            !a.is_booked &&
            selectedDuration <= slotMinutes &&
            new Date(a.end_datetime) > now
          );
        });
      setAvailabilities(filtered);

      const generatedSlots: { availabilityId: number; start: string }[] = [];
      filtered.forEach((a) => {
        const start = toLocalDate(a.start_datetime);
        const end = toLocalDate(a.end_datetime);
        const stepMinutes = 60; // pas de 1h entre départs
        const bufferMinutes = 60;
        let cursor = new Date(start);
        while (
          cursor.getTime() +
            (selectedDuration + bufferMinutes) * 60000 <=
          end.getTime()
        ) {
          generatedSlots.push({
            availabilityId: a.id,
            start: formatLocalISO(cursor),
          });
          cursor = new Date(cursor.getTime() + stepMinutes * 60000);
        }
      });
      setTimeSlots(generatedSlots);
    } catch (e) {
      console.error(e);
      setApiError("Impossible de charger les créneaux.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function refreshAvailableDates() {
    try {
      const data = await getAvailabilities();
      const now = new Date();
      const unique = Array.from(
        new Set(
          data
            .filter((a) => !a.is_booked)
            .filter((a) => new Date(a.end_datetime) > now)
            .map((a) => a.start_datetime.slice(0, 10))
        )
      ).sort();
      const mapped = unique.map((iso) => ({
        value: iso,
        label: new Date(iso).toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
      }));
      setAvailableDates(mapped);
      if (!selectedDate && mapped.length) {
        setSelectedDate(mapped[0].value);
        void handleSelectDate(mapped[0].value);
      }
    } catch (e) {
      console.error(e);
      setAvailableDates(days);
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedSlot || !selectedDuration) return;
    setLoading(true);
    setApiError(null);

    try {
      await createBooking({
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        serviceId: selectedService.id,
        availabilityId: selectedSlot.availabilityId,
        durationMinutes: selectedDuration,
        startDateTime: selectedSlot.start,
      });
      setStep(5);
    } catch (err: any) {
      const msg = err?.message || "Erreur lors de la réservation.";
      if (msg.includes("trop court") || msg.includes("Durée supérieure")) {
        setApiError(
          "Ce créneau est déjà partiellement pris. Choisissez un autre horaire ou contactez Sam."
        );
      } else if (msg.includes("moins de 2h") || msg.includes("2h")) {
        setApiError(
          "Sam n'accepte pas les demandes créées moins de 2h avant le début. Merci de choisir un horaire ultérieur."
        );
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl bg-white shadow-2xl md:mx-0 mx-auto p-6 md:p-8 transform transition-all md:scale-100 md:translate-y-0 translate-y-0"
        onClick={(e) => e.stopPropagation()}
      >
       
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Réservation
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 && "Choisissez un massage"}
              {step === 2 && "Choisissez une date"}
              {step === 3 && "Choisissez un créneau"}
              {step === 4 && "Vos coordonnées"}
              {step === 5 && "C’est réservé ✨"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-100"
          >
            <span className="text-gray-500 text-lg">×</span>
          </button>
        </div>


        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full flex-1 ${
                step >= s ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        
        <div className="space-y-4">
      {step === 1 && (
        <StepService
          services={services}
          selectedService={selectedService}
          selectedDuration={selectedDuration}
          loading={loadingServices}
        onSelect={(s, duration) => {
          setSelectedService(s);
          setSelectedDuration(duration);
          setSelectedDate("");
          setAvailabilities([]);
          setTimeSlots([]);
          setSelectedSlot(null);
        }}
      />
    )}

          {step === 2 && (
            <StepDate
              days={availableDates.length ? availableDates : days}
              selectedDate={selectedDate}
              onSelect={handleSelectDate}
              loading={loadingSlots}
            />
          )}

          {step === 3 && (
            <StepSlot
              slots={timeSlots}
              selectedSlot={selectedSlot}
              loading={loadingSlots}
              onSelect={setSelectedSlot}
            />
          )}

          {step === 4 && (
            <StepClient
              service={selectedService}
              slot={selectedSlot}
              duration={selectedDuration}
              clientName={clientName}
              clientEmail={clientEmail}
              clientPhone={clientPhone}
              setClientName={setClientName}
              setClientEmail={setClientEmail}
              setClientPhone={setClientPhone}
            />
          )}

          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <p className="text-lg font-semibold text-gray-900">
                Demande envoyée 🙏
              </p>
              <p className="text-gray-600 text-sm">
                Vous recevrez un email de confirmation ou de refus. Si vous n&apos;avez pas de réponse
                au plus tard 2h avant l&apos;horaire choisi, considérez la demande annulée.
                Pensez à vérifier vos spams pour être sûr de recevoir les emails.
              </p>
              <button
                onClick={onClose}
                className="mt-2 w-full rounded-full bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-black transition"
              >
                Fermer
              </button>
            </div>
          )}

          {apiError && (
            <p className="text-sm text-red-500 mt-2">{apiError}</p>
          )}
        </div>

        {step !== 5 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={
                step === 1 ? onClose : () => setStep((s) => (s - 1) as any)
              }
            >
              {step === 1 ? "Annuler" : "Retour"}
            </button>

            <button
              className="ml-auto rounded-full bg-gray-900 text-white px-5 py-2 text-sm font-medium disabled:bg-gray-300 disabled:text-gray-500"
              disabled={
                (step === 1 && (!selectedService || !selectedDuration)) ||
                (step === 2 && !selectedDate) ||
                (step === 3 && !selectedSlot) ||
                (step === 4 &&
                  (!clientName.trim() || !clientEmail.trim()) ||
                  loading)
              }
              onClick={() => {
                if (step < 4) {
                  setStep((s) => (s + 1) as any);
                } else {
                  void handleSubmit();
                }
              }}
            >
              {step < 4
                ? "Continuer"
                : loading
                ? "Envoi..."
                : "Confirmer la demande"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


type StepServiceProps = {
  services: Service[];
  selectedService: Service | null;
  selectedDuration: number | null;
  loading: boolean;
  onSelect: (s: Service, duration: number | null) => void;
};

function StepService({
  services,
  selectedService,
  selectedDuration,
  loading,
  onSelect,
}: StepServiceProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-2xl px-4 py-3 border-gray-100"
          >
            <Skeleton className="h-5 w-1/2 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!services.length) {
    return (
      <p className="text-sm text-gray-500">
        Aucun massage n&apos;est disponible pour le moment.
      </p>
    );
  }

    return (
    <div className="space-y-3">
      {services.map((s) => {
        const selected = selectedService?.id === s.id;
        const durations = s.durations_prices ? Object.entries(s.durations_prices) : [];

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              const first = durations[0]?.[0];
              onSelect(s, first ? Number(first) : null);
            }}
            className={`w-full text-left border rounded-2xl px-4 py-3 transition ${
              selected
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{s.title}</span>
            </div>
            {durations.length > 0 && (
              <div className="mt-2 space-y-2 text-[11px] text-emerald-700 text-center md:text-left">
                {durations.map(([minutes, price]) => (
                  <label
                    key={minutes}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <input
                      type="radio"
                      name={`duration-${s.id}`}
                      checked={
                        selected && selectedDuration === Number(minutes)
                      }
                      onChange={() => onSelect(s, Number(minutes))}
                    />
                    <span>
                      {minutes} min – {Number(price).toFixed(2)} €
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 line-clamp-2">
              {s.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}


type StepDateProps = {
  days: { value: string; label: string }[];
  selectedDate: string;
  onSelect: (date: string) => void;
  loading: boolean;
};

function StepDate({
  days,
  selectedDate,
  onSelect,
  loading,
}: StepDateProps) {
  if (!days.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 font-medium">
          Aucun créneau n&apos;est disponible pour le moment.
        </p>
        <p className="text-sm text-gray-500">
          Contactez Sam pour organiser un rendez-vous directement.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-500 transition"
        >
          Contacter Sam
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Sélectionnez un jour parmi les prochains jours.
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const isActive = d.value === selectedDate;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onSelect(d.value)}
              className={`flex-shrink-0 px-3 py-2 rounded-2xl border text-xs ${
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {loading && (
        <p className="mt-3 text-xs text-gray-400">Chargement des créneaux…</p>
      )}
    </div>
  );
}

type StepSlotProps = {
  slots: { availabilityId: number; start: string }[];
  selectedSlot: { availabilityId: number; start: string } | null;
  loading?: boolean;
  onSelect: (s: { availabilityId: number; start: string }) => void;
};

function StepSlot({ slots, selectedSlot, onSelect, loading }: StepSlotProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 mb-1">Recherche des créneaux…</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-16 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 font-medium">
          Aucun créneau disponible pour cette date.
        </p>
        <p className="text-sm text-gray-500">
          Contactez Sam pour trouver un créneau sur-mesure.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-500 transition"
        >
          Contacter Sam
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-1">
        Choisissez l&apos;heure qui vous convient.
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, idx) => {
          const isActive =
            selectedSlot?.availabilityId === slot.availabilityId &&
            selectedSlot.start === slot.start;
          const label = formatTime(slot.start);
          return (
            <button
              key={`${slot.availabilityId}-${idx}`}
              type="button"
              onClick={() => onSelect(slot)}
              className={`px-3 py-2 rounded-full border text-xs ${
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type StepClientProps = {
  service: Service | null;
  slot: { availabilityId: number; start: string } | null;
  duration: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  setClientName: (v: string) => void;
  setClientEmail: (v: string) => void;
  setClientPhone: (v: string) => void;
};

function StepClient({
  service,
  slot,
  duration,
  clientName,
  clientEmail,
  clientPhone,
  setClientName,
  setClientEmail,
  setClientPhone,
}: StepClientProps) {
  return (
    <div className="space-y-4">
      {service && slot && (
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-700">
          <p className="font-medium text-gray-900 mb-1">{service.title}</p>
          <p>
            {new Date(slot.start).toLocaleDateString(
              "fr-FR",
              dateOptions
            )}{" "}
            à {formatTime(slot.start)}
          </p>
          {duration && (
            <p className="mt-1">Durée choisie : {duration} min</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          name="client_name"
          placeholder="Votre prénom / nom"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <input
          type="email"
          name="client_email"
          placeholder="Votre email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <input
          type="tel"
          name="client_phone"
          placeholder="Téléphone (optionnel)"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <p className="text-[11px] text-gray-400">
          Vos informations restent strictement confidentielles. Elles servent
          uniquement à confirmer votre rendez-vous.
        </p>
      </div>
    </div>
  );
}
