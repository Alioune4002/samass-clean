"use client";

import { useEffect, useState } from "react";
import {
  adminGetBooking,
  adminConfirmBooking,
  adminCancelBooking,
} from "@/lib/adminApi";
import { Booking } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetBooking(id);
        setBooking(data);
      } catch (err) {
        console.error("Erreur chargement réservation :", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  async function handleAction(action: "confirm" | "cancel") {
    try {
      if (action === "confirm") {
        await adminConfirmBooking(id);
      } else {
        await adminCancelBooking(id);
      }
      // rafraîchir les badges (pending -> confirm/cancel)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("admin-badges-refresh"));
      }
      router.push("/admin-samass-98342/bookings");
    } catch (err) {
      console.error("Erreur action réservation :", err);
      alert("Impossible de mettre à jour la réservation");
    }
  }

  async function askForReview() {
    if (!booking || booking.status !== "confirmed") return;
    if (!window.confirm(`Envoyer une invitation à laisser un avis à ${booking.client_name} ?`)) return;
    setInviting(true);
    setReviewError("");
    setReviewSuccess("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invitation impossible.");
      setReviewSuccess("Demande d'avis envoyée. Le client recevra un lien personnel valable 30 jours.");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "L'envoi a échoué.");
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400 animate-pulse">Chargement...</p>;
  }

  if (!booking) {
    return <p className="text-red-400">Réservation introuvable.</p>;
  }

  return (
    <div className="text-white space-y-6">
      <h1 className="text-3xl font-bold">Demande de réservation</h1>

      {/* CARD */}
      <div className="bg-[#1A1A1A] border border-gray-800 p-6 rounded-xl space-y-3 shadow-xl">
        <p>
          <span className="text-gray-400">Client :</span>{" "}
          {booking.client_name}
        </p>
        <p>
          <span className="text-gray-400">Email :</span>{" "}
          {booking.client_email}
        </p>
        <p>
          <span className="text-gray-400">Téléphone :</span>{" "}
          {booking.client_phone || "—"}
        </p>

        <p>
          <span className="text-gray-400">Service :</span>{" "}
          {booking.service.title}
        </p>

        <p>
          <span className="text-gray-400">Créneau :</span>{" "}
          {new Date(
            booking.availability.start_datetime
          ).toLocaleString("fr-FR")}
        </p>

        <p>
          <span className="text-gray-400">Statut :</span>{" "}
          <span
            className={`px-3 py-1 rounded-lg text-sm ${
              booking.status === "pending"
                ? "bg-yellow-600"
                : booking.status === "confirmed"
                ? "bg-emerald-600"
                : "bg-red-600"
            }`}
          >
            {booking.status}
          </span>
        </p>
      </div>

      {booking.status === "confirmed" && (
        <section className="rounded-xl border border-emerald-900 bg-[#17241f] p-5">
          <h2 className="text-xl font-semibold text-white">Après la séance</h2>
          <p className="mt-2 text-sm leading-6 text-gray-300">
            Une fois le massage terminé, vous pouvez demander au client comment
            il a vécu son expérience. L'email contient un lien d'avis personnel,
            sans détail sur le massage reçu.
          </p>
          {reviewSuccess && <p className="mt-3 text-sm text-emerald-300" role="status">{reviewSuccess}</p>}
          {reviewError && <p className="mt-3 text-sm text-red-300" role="alert">{reviewError}</p>}
          <button type="button" disabled={inviting || Boolean(reviewSuccess)}
            onClick={askForReview}
            className="mt-4 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {inviting ? "Envoi en cours…" : "Envoyer une demande d'avis"}
          </button>
        </section>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-4">
        <button
          onClick={() => handleAction("confirm")}
          className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
        >
          Confirmer
        </button>

        <button
          onClick={() => handleAction("cancel")}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
