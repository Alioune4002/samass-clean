"use client";

import { useEffect, useState } from "react";
import { adminGetBookings } from "@/lib/adminApi";
import { Booking } from "@/lib/types";
import Link from "next/link";
import Skeleton from "@/app/components/ui/Skeleton";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await adminGetBookings();
        setBookings(data);
        // Met à jour les pastilles (pending)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("admin-badges-refresh"));
        }
      } catch (err) {
        console.error("Erreur chargement réservations:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter === "pending") return b.status === "pending";
    if (filter === "confirmed") return b.status === "confirmed";
    return true;
  });

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Réservations</h1>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6">
        {[
          { key: "all", label: "Toutes" },
          { key: "pending", label: "En attente" },
          { key: "confirmed", label: "Confirmées" },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === btn.key
                ? "bg-emerald-600 text-white"
                : "bg-[#1A1A1A] border border-gray-800 text-gray-300 hover:bg-gray-900"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-[#1A1A1A] border border-gray-800 rounded-lg"
            >
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400">Aucune réservation trouvée.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/admin-samass-98342/bookings/${b.id}`}
              className="block p-4 bg-[#1A1A1A] border border-gray-800 rounded-lg hover:bg-gray-900 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{b.client_name}</p>
                  <p className="text-gray-400 text-sm">{b.client_email}</p>
                  <p className="text-gray-400 text-sm">
                    {b.service.title} ·{" "}
                    {new Date(
                      b.availability.start_datetime
                    ).toLocaleString("fr-FR")}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-lg text-sm ${
                    b.status === "pending"
                      ? "bg-yellow-600"
                      : b.status === "confirmed"
                      ? "bg-emerald-600"
                      : "bg-red-600"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
