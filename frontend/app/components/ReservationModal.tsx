"use client";

import { useEffect, useState } from "react";
import {
  listProposableTimes,
  nextProposableSlot,
  parisHour,
  parisToday,
  parisTomorrow,
  prettyDate,
  prettyHour,
  validateProposedSlot,
} from "@/lib/bookingSlots";
import { createBooking, getServices } from "@/lib/api";
import { Service } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: number | null;
};

function formatRequestedSlot(date: string, time: string) {
  if (!date || !time) return "";
  return `${prettyDate(date)} à ${prettyHour(time)}`;
}

export default function ReservationModal({
  isOpen,
  onClose,
  initialServiceId,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clock, setClock] = useState(() => new Date());

  const todayParis = parisToday(clock);
  const tomorrowParis = parisTomorrow(clock);
  const firstProposable = duration ? nextProposableSlot(duration, clock) : null;
  const timesForDate = date && duration ? listProposableTimes(date, duration, clock) : [];
  const noMoreToday = Boolean(firstProposable && firstProposable.date > todayParis);

  useEffect(() => {
    if (!isOpen) return;
    setClock(new Date());
    const interval = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setDate("");
    setTime("");
    setError("");
    setSuccessMessage("");

    let active = true;
    setLoadingServices(true);
    getServices()
      .then((items) => {
        if (!active) return;
        setServices(items);
        const preselected = initialServiceId
          ? items.find((item) => item.id === initialServiceId)
          : null;
        if (preselected) {
          setSelectedService(preselected);
          const first = Number(Object.keys(preselected.durations_prices)[0]);
          setDuration(Number.isFinite(first) ? first : null);
        } else {
          setSelectedService(null);
          setDuration(null);
        }
      })
      .catch(() => setError("Impossible de charger les massages."))
      .finally(() => setLoadingServices(false));

    return () => {
      active = false;
    };
  }, [isOpen, initialServiceId]);

  // Les heures proposées évoluent même si le formulaire reste ouvert.
  useEffect(() => {
    if (!isOpen || step !== 3 || !duration) return;
    const next = nextProposableSlot(duration, clock);
    if (!next) return;

    if (!date || date < next.date) {
      setDate(next.date);
      setTime("");
    } else if (time && !listProposableTimes(date, duration, clock).includes(time)) {
      setTime("");
    }
  }, [isOpen, step, duration, clock, date, time]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const requestedLabel = formatRequestedSlot(date, time);

  function goToContactDetails() {
    const validation = validateProposedSlot(
      `${date}T${time}:00`,
      duration ?? 0,
      new Date()
    );
    if (!validation.valid) {
      setError(validation.error || "Choisissez un autre horaire.");
      setTime("");
      if (validation.nextProposable) setDate(validation.nextProposable.date);
      return;
    }
    setError("");
    setStep(4);
  }

  async function submit() {
    if (!selectedService || !duration || !date || !time || !name || !email) {
      setError("Merci de renseigner les informations obligatoires.");
      return;
    }

    // Second contrôle avant envoi : le visiteur peut laisser l'étape ouverte.
    const validation = validateProposedSlot(
      `${date}T${time}:00`,
      duration,
      new Date()
    );
    if (!validation.valid) {
      setError(validation.error || "Choisissez un nouvel horaire.");
      if (validation.nextProposable) setDate(validation.nextProposable.date);
      setTime("");
      setStep(3);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await createBooking({
        client_name: name,
        client_email: email,
        client_phone: phone,
        client_comment: comment,
        availabilityId: -1,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        durationMinutes: duration,
        startDateTime: `${date}T${time}:00`,
        slotLabel: requestedLabel,
      });
      setSuccessMessage(result.mode === "fallback" ? result.message : "Votre demande a bien été envoyée.");
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la demande.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#10241d]/55 backdrop-blur-sm md:items-center md:p-6"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Demande de réservation SAMASS"
        className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[30px] bg-[#f8f5ec] shadow-2xl md:max-w-2xl md:rounded-[32px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-[#d9d0bd] bg-[#f8f5ec]/95 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a36f2d]">
                Revenir à soi
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#17352d]">
                Demander un rendez-vous
              </h2>
              <p className="mt-1 text-sm text-[#657069]">
                Vous proposez un horaire. Sam vous confirme ensuite personnellement.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#d9d0bd] px-3 py-2 text-sm text-[#4f5a54]"
            >
              Fermer
            </button>
          </div>

          {step < 5 && (
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e7dfcf]">
              <div
                className="h-full rounded-full bg-[#1f5a49] transition-all"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-7 md:px-8 md:py-8">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-5 text-sm font-medium text-[#657069]">1 · Choisissez votre massage</p>
              {loadingServices ? (
                <p className="text-[#657069]">Chargement…</p>
              ) : (
                <div className="grid gap-3">
                  {services.map((service) => {
                    const selected = selectedService?.id === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(service);
                          const first = Number(Object.keys(service.durations_prices)[0]);
                          setDuration(Number.isFinite(first) ? first : null);
                        }}
                        className={`rounded-[22px] border p-5 text-left transition ${
                          selected
                            ? "border-[#1f5a49] bg-[#eaf1ec] shadow-sm"
                            : "border-[#ded6c7] bg-white/75 hover:border-[#b9ad99]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[#17352d]">{service.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-[#657069]">{service.description}</p>
                          </div>
                          <span className="text-[#a36f2d]">{selected ? "✓" : "→"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className="mt-6 w-full rounded-full bg-[#17352d] px-5 py-3 font-semibold text-white disabled:opacity-40"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 2 && selectedService && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#657069]">2 · Choisissez la durée</p>
              <h3 className="text-2xl font-semibold text-[#17352d]">{selectedService.title}</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {Object.entries(selectedService.durations_prices).map(([minutes, price]) => {
                  const value = Number(minutes);
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(value)}
                      className={`rounded-[22px] border px-4 py-5 text-center transition ${
                        duration === value
                          ? "border-[#1f5a49] bg-[#eaf1ec]"
                          : "border-[#ded6c7] bg-white/75"
                      }`}
                    >
                      <span className="block text-xl font-semibold text-[#17352d]">{minutes} min</span>
                      <span className="mt-1 block text-sm text-[#a36f2d]">{Number(price).toFixed(0)} €</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-full border border-[#cfc5b4] px-5 py-3 text-[#4f5a54]">Retour</button>
                <button type="button" disabled={!duration} onClick={() => setStep(3)} className="flex-1 rounded-full bg-[#17352d] px-5 py-3 font-semibold text-white disabled:opacity-40">Continuer</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#657069]">3 · Quel horaire vous conviendrait ?</p>
              <h3 className="text-2xl font-semibold text-[#17352d]">Proposez votre créneau</h3>
              <p className="mt-2 text-sm leading-6 text-[#657069]">
                Pour permettre à Sam de préparer votre massage avec attention,
                choisissez un horaire au moins 3 heures à l’avance.
                Chaque demande reste soumise à sa confirmation.
              </p>

              {noMoreToday && firstProposable && (
                <div className="mt-5 rounded-[22px] border border-[#d7c9ad] bg-[#f1e9d9] px-4 py-4 text-sm leading-6 text-[#604d35]" role="status">
                  <strong className="block text-[#17352d]">
                    {parisHour(clock) >= 20
                      ? "Sam a terminé ses séances pour aujourd’hui."
                      : parisHour(clock) >= 16
                        ? "Sam approche de la fin de sa journée."
                        : "Les propositions pour aujourd’hui sont terminées."}
                  </strong>
                  Pour lui laisser le temps de préparer au mieux votre rendez-vous,
                  vous pouvez proposer un horaire dès <strong>{firstProposable.date === tomorrowParis ? "demain" : prettyDate(firstProposable.date)} à {prettyHour(firstProposable.time)}</strong>.
                  Ce créneau n’est pas encore réservé : Sam vous répondra pour le confirmer.
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-[#4f5a54]">
                  Date souhaitée
                  <input
                    type="date"
                    min={firstProposable?.date || todayParis}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setTime("");
                      setError("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 text-[#17352d] outline-none focus:border-[#1f5a49]"
                  />
                </label>
                <label className="text-sm text-[#4f5a54]">
                  Heure souhaitée
                  <select
                    value={time}
                    disabled={!date || timesForDate.length === 0}
                    onChange={(event) => {
                      setTime(event.target.value);
                      setError("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 text-[#17352d] outline-none focus:border-[#1f5a49] disabled:opacity-50"
                  >
                    <option value="">Choisir une heure</option>
                    {timesForDate.map((slot) => (
                      <option key={slot} value={slot}>{prettyHour(slot)}</option>
                    ))}
                  </select>
                </label>
              </div>

              {date && timesForDate.length === 0 && (
                <p className="mt-4 text-sm leading-6 text-[#8a6a3b]" role="status">
                  Aucun horaire à proposer ce jour-là avec le délai de préparation
                  et une fin de massage à 20 h. Choisissez une autre date.
                </p>
              )}

              {timesForDate.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-[#4f5a54]">Quelques horaires possibles à proposer :</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {timesForDate.slice(0, 5).map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => {
                          setTime(slot);
                          setError("");
                        }}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          time === slot
                            ? "border-[#1f5a49] bg-[#1f5a49] text-white"
                            : "border-[#cfc5b4] bg-white text-[#17352d] hover:border-[#1f5a49]"
                        }`}
                      >
                        {prettyHour(slot)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#657069]">
                    Horaires de proposition : à partir de 10 h, avec une fin de séance
                    avant 20 h. Le dernier début possible dépend de la durée du massage.
                    Ces horaires ne sont pas des disponibilités confirmées.
                    Les heures sont celles de Quimper.
                  </p>
                </div>
              )}

              {requestedLabel && timesForDate.includes(time) && (
                <div className="mt-5 rounded-2xl bg-[#eaf1ec] px-4 py-3 text-sm text-[#285044]">
                  Votre préférence : <strong>{requestedLabel}</strong>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-full border border-[#cfc5b4] px-5 py-3 text-[#4f5a54]">Retour</button>
                <button type="button" disabled={!date || !time || !timesForDate.includes(time)} onClick={goToContactDetails} className="flex-1 rounded-full bg-[#17352d] px-5 py-3 font-semibold text-white disabled:opacity-40">Continuer</button>
              </div>
            </div>
          )}

          {step === 4 && selectedService && duration && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#657069]">4 · Vos coordonnées</p>
              <h3 className="text-2xl font-semibold text-[#17352d]">Dernière étape</h3>
              <div className="mt-6 grid gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom *" className="rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 outline-none focus:border-[#1f5a49]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 outline-none focus:border-[#1f5a49]" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 outline-none focus:border-[#1f5a49]" />
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Une précision pour Sam ? (facultatif)" rows={4} className="rounded-2xl border border-[#cfc5b4] bg-white px-4 py-3 outline-none focus:border-[#1f5a49]" />
              </div>
              <div className="mt-5 rounded-[22px] border border-[#ded6c7] bg-white/65 p-4 text-sm leading-6 text-[#4f5a54]">
                <strong className="text-[#17352d]">{selectedService.title}</strong> · {duration} min<br />
                {requestedLabel}<br />
                <span className="text-[#8a6a3b]">Votre rendez-vous sera confirmé seulement après la réponse de Sam.</span>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-full border border-[#cfc5b4] px-5 py-3 text-[#4f5a54]">Retour</button>
                <button type="button" disabled={loading || !name || !email} onClick={submit} className="flex-1 rounded-full bg-[#17352d] px-5 py-3 font-semibold text-white disabled:opacity-40">
                  {loading ? "Envoi…" : "Envoyer la demande"}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcebe3] text-2xl text-[#1f5a49]">✓</div>
              <h3 className="mt-5 text-3xl font-semibold text-[#17352d]">Demande envoyée</h3>
              <p className="mx-auto mt-3 max-w-md leading-7 text-[#657069]">
                {successMessage || "Sam a bien reçu votre demande et vous répondra rapidement."}
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8a6a3b]">
                Le rendez-vous n’est pas encore confirmé. Vous recevrez un email lorsqu’il le sera.
              </p>
              <button type="button" onClick={onClose} className="mt-7 rounded-full bg-[#17352d] px-6 py-3 font-semibold text-white">Fermer</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
