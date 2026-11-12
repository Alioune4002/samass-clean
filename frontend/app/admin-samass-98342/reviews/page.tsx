"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { hasSessionEndedInParis } from "@/lib/bookingSlots";

type BookingSummary = {
  id: string;
  client_name: string;
  client_email: string;
  service_title: string;
  requested_datetime: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "canceled";
};

type Review = {
  kind: "review" | "invitation";
  id: string;
  name: string;
  email: string;
  rating?: number;
  comment?: string;
  public_name?: string;
  consent?: boolean;
  invitation_id?: string;
  booking_id?: string;
  visit_date?: string;
  status: "pending" | "published" | "hidden" | "rejected" | "sent" | "failed" | "used";
  created_at: string;
};

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [manualInvite, setManualInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"pending" | "all" | "published" | "hidden">("pending");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger les avis.");
    const values = await response.json() as Review[];
    setRows(values);
    window.dispatchEvent(new Event("admin-badges-refresh"));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      reload(),
      fetch("/api/admin/bookings", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Les réservations ne sont pas disponibles.");
          return response.json() as Promise<BookingSummary[]>;
        })
        .then((items) => {
          if (active) setBookings(Array.isArray(items) ? items : []);
        }),
    ]).then(([reviewsResult, bookingsResult]) => {
      if (!active) return;
      if (reviewsResult.status === "rejected") setError("Impossible de charger les avis.");
      if (bookingsResult.status === "rejected") {
        setBookingError("Impossible de récupérer les réservations. L'invitation manuelle reste disponible.");
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    const booking = bookings.find((item) => item.id === selectedBookingId);
    if (!manualInvite && !booking) {
      setError("Sélectionnez une réservation avant d'envoyer une invitation.");
      return;
    }
    const destination = manualInvite ? email : booking?.client_email || "";
    if (!window.confirm(`Envoyer la demande d'avis à ${manualInvite ? name : booking?.client_name} (${destination}) ?`)) {
      return;
    }
    setSending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualInvite ? { name, email } : { booking_id: selectedBookingId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setMessage("Invitation personnelle envoyée à " + destination + ". Le lien mène à la page Avis et expire sous 30 jours.");
      setName("");
      setEmail("");
      setSelectedBookingId("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  async function change(id: string, action: "publish" | "hide" | "reject") {
    setError("");
    setMessage("");
    let reason = "";
    if (action === "reject") {
      const answer = window.prompt(
        "Motif du refus à communiquer au client (injures, données privées, spam, hors sujet, etc.) :",
        ""
      );
      if (answer === null) return;
      reason = answer.trim();
      if (reason.length < 10 || reason.length > 280) {
        setError("Veuillez indiquer un motif entre 10 et 280 caractères.");
        return;
      }
    }
    try {
      const response = await fetch("/api/admin/reviews/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action impossible.");
      await reload();
      setMessage(action === "publish"
        ? "Témoignage publié."
        : action === "reject"
          ? data.notification_sent
            ? "Avis refusé. Le motif a été transmis au client par email."
            : "Avis refusé, mais le message d'information n'a pas pu être envoyé. Contactez le client manuellement."
          : "Témoignage masqué.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    }
  }

  const reviews = rows.filter((row) => row.kind === "review");
  const filteredReviews = reviews.filter((row) => {
    if (filter === "all") return true;
    if (filter === "hidden") return row.status === "hidden" || row.status === "rejected";
    return row.status === filter;
  });
  const invitations = rows.filter((row) => row.kind === "invitation");
  const alreadyInvited = new Set(invitations
    .filter((item) => item.booking_id && ["sent", "used"].includes(item.status))
    .map((item) => item.booking_id));
  const eligibleBookings = bookings
    .filter((item) => item.status === "confirmed" &&
      hasSessionEndedInParis(item.requested_datetime, item.duration_minutes))
    .sort((a, b) => b.requested_datetime.localeCompare(a.requested_datetime));
  const selectedBooking = eligibleBookings.find((item) => item.id === selectedBookingId);

  return (
    <div className="max-w-5xl space-y-9 text-gray-100">
      <div>
        <p className="text-xs uppercase tracking-[.25em] text-emerald-400">SAMASS · Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">Avis clients</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Envoyer une invitation après une véritable séance, puis retrouver les avis déposés.
          Les retours peuvent être positifs ou négatifs. Ils restent privés sans accord de publication.
        </p>
        <Link href="/avis" target="_blank" className="mt-3 inline-block text-sm text-emerald-300 underline">
          Voir la page publique des avis
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-[#1b1b1b] p-5 md:p-7">
        <h2 className="text-xl font-semibold">Demander un avis après une séance</h2>
        <p className="mt-2 text-sm text-gray-400">
          Choisissez une réservation confirmée et terminée : le nom et l'email du client
          sont récupérés automatiquement. Aucun envoi n'est fait sans votre clic.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setManualInvite(false); setError(""); }}
            className={`rounded-full px-4 py-2 text-sm ${!manualInvite
              ? "bg-emerald-700 text-white" : "border border-gray-700 text-gray-300"}`}>
            Depuis une réservation
          </button>
          <button type="button" onClick={() => { setManualInvite(true); setError(""); }}
            className={`rounded-full px-4 py-2 text-sm ${manualInvite
              ? "bg-emerald-700 text-white" : "border border-gray-700 text-gray-300"}`}>
            Client venu par message
          </button>
        </div>

        <form onSubmit={invite} className="mt-5 space-y-4">
          {!manualInvite ? (
            <>
              <label className="block text-sm font-medium text-gray-200" htmlFor="review-booking-select">
                Séance terminée
              </label>
              <select id="review-booking-select" required value={selectedBookingId}
                onChange={(event) => setSelectedBookingId(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-[#101010] p-3 text-sm text-white">
                <option value="">Choisir un client et une réservation</option>
                {eligibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id} disabled={alreadyInvited.has(booking.id)}>
                    {booking.client_name} · {new Date(booking.requested_datetime.slice(0, 16) + ":00Z")
                      .toLocaleDateString("fr-FR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}{booking.service_title}
                    {alreadyInvited.has(booking.id) ? " · Invitation déjà envoyée" : ""}
                  </option>
                ))}
              </select>
              {bookingError && <p className="text-sm text-amber-300">{bookingError}</p>}
              {eligibleBookings.length === 0 && !bookingError && (
                <p className="text-sm text-gray-400">
                  Aucune réservation confirmée et terminée pour le moment.
                  Vous pouvez inviter un client venu par message avec l'autre onglet.
                </p>
              )}
              {selectedBooking && (
                <div className="rounded-xl bg-[#12271f] px-4 py-3 text-sm leading-6 text-emerald-100">
                  <strong>{selectedBooking.client_name}</strong>
                  <span className="block break-all">{selectedBooking.client_email}</span>
                  <span className="text-xs text-emerald-300">
                    Les coordonnées seront reprises depuis cette réservation.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-gray-200">
                Nom du client
                <input required minLength={2} maxLength={70} value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Prénom et nom"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-[#101010] p-3 text-white"/>
              </label>
              <label className="block text-sm text-gray-200">
                Email du client
                <input required type="email" maxLength={254} value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@exemple.fr"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-[#101010] p-3 text-white"/>
              </label>
            </div>
          )}
          <button disabled={sending || (!manualInvite && !selectedBookingId)}
            type="submit"
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {sending ? "Envoi en cours…" : "Envoyer la demande d'avis"}
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-gray-500">
          Chaque invitation contient un lien personnel valable 30 jours, utilisable une seule fois.
          Le client est libre de laisser une note de 1 à 5 et son avis reste privé avant modération.
        </p>
      </section>

      {message && <p role="status" className="rounded-xl border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-200">{error}</p>}

      <section>
        <h2 className="text-2xl font-semibold">Témoignages reçus <span className="text-gray-400">({reviews.length})</span></h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["pending", "À valider"],
            ["published", "Publiés"],
            ["hidden", "Masqués / refusés"],
            ["all", "Tous"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)}
              className={`rounded-full border px-4 py-2 text-xs ${filter === value
                ? "border-emerald-500 bg-emerald-800 text-white"
                : "border-gray-700 text-gray-300"}`}>
              {label}
            </button>
          ))}
        </div>
        {loading ? <p className="mt-4 text-gray-400">Chargement…</p> : filteredReviews.length === 0 ? (
          <p className="mt-4 rounded-xl border border-gray-800 p-5 text-sm text-gray-400">Aucun témoignage reçu pour l'instant.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {filteredReviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-gray-800 bg-[#1b1b1b] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{review.name} <span className="ml-2 text-sm font-normal text-gray-400">{review.email}</span></p>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs">{review.status === "pending" ? "À valider" : review.status === "published" ? "Publié" : review.status === "rejected" ? "Refusé" : "Masqué"}</span>
                </div>
                <p className="mt-2 text-lg text-amber-300">{"★".repeat(review.rating || 0)}<span className="text-gray-600">{"☆".repeat(5 - (review.rating || 0))}</span></p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-200">{review.comment}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("fr-FR")} ·
                  Accord de publication : <strong className={review.consent ? "text-emerald-300" : "text-gray-400"}>{review.consent ? "Oui" : "Non"}</strong>
                  {review.consent && review.public_name ? " · Nom public : " + review.public_name : ""}
                  {" · Origine : "}{review.invitation_id ? "invitation personnalisée" : "formulaire du site"}
                  {review.visit_date ? ` · Séance du ${new Date(review.visit_date + "T12:00:00Z").toLocaleDateString("fr-FR")}` : ""}
                  {review.booking_id && (
                    <>
                      {" · "}
                      <Link href={`/admin-samass-98342/bookings/${encodeURIComponent(review.booking_id)}`}
                        className="text-emerald-300 underline">
                        Voir la réservation liée
                      </Link>
                    </>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.status !== "published" && review.consent && (
                    <button onClick={() => change(review.id, "publish")}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">Publier</button>
                  )}
                  {review.status === "pending" && (
                    <button onClick={() => change(review.id, "reject")}
                      className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-200">Refuser</button>
                  )}
                  {review.status === "published" && (
                    <button onClick={() => change(review.id, "hide")}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200">Retirer du site</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Invitations envoyées ({invitations.length})</h2>
        <div className="mt-3 space-y-2">
          {invitations.length === 0 ? <p className="text-sm text-gray-400">Aucune invitation envoyée.</p> : invitations.map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-gray-800 px-4 py-3 text-sm">
              <span>{item.name} · <span className="text-gray-400">{item.email}</span></span>
              <span className="text-gray-400">
                {new Date(item.created_at).toLocaleDateString("fr-FR")}
                {" · "}
                {item.status === "used" ? "Avis reçu" : item.status === "failed" ? "Envoi échoué" : "Envoyée"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
