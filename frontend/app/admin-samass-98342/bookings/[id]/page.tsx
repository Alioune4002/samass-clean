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
  const id = Number(params?.id);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

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
      router.push("/admin-samass-98342/bookings");
    } catch (err) {
      console.error("Erreur action réservation :", err);
      alert("Impossible de mettre à jour la réservation");
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
      <h1 className="text-3xl font-bold">Réservation #{booking.id}</h1>

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
