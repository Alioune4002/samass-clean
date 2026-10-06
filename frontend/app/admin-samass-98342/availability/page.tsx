"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminGetBookings } from "@/lib/adminApi";
import { Booking } from "@/lib/types";

type Filter = "all" | "confirmed" | "pending";

export default function AdminPlanningPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    adminGetBookings()
      .then(setBookings)
      .catch((error) => console.error("Planning SAMASS :", error))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((booking) => booking.status !== "canceled")
      .filter((booking) => {
        const time = new Date(booking.availability.start_datetime).getTime();
        return Number.isFinite(time) && time >= now - 1000 * 60 * 60 * 12;
      })
      .filter((booking) => filter === "all" || booking.status === filter)
      .sort(
        (a, b) =>
          new Date(a.availability.start_datetime).getTime() -
          new Date(b.availability.start_datetime).getTime()
      );
  }, [bookings, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    for (const booking of visible) {
      const key = new Date(booking.availability.start_datetime).toLocaleDateString(
        "fr-FR",
        { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
      );
      groups.set(key, [...(groups.get(key) || []), booking]);
    }
    return [...groups.entries()];
  }, [visible]);

  return (
    <div className="mx-auto max-w-5xl space-y-7 text-white">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
          Espace Sam
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Planning</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
          Une seule vue pour les horaires demandés et les rendez-vous confirmés.
          Les demandes en attente restent clairement séparées des rendez-vous validés.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "Tout"],
          ["confirmed", "Confirmés"],
          ["pending", "À confirmer"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              filter === value
                ? "bg-emerald-500 text-[#07140f]"
                : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-lg font-medium">Rien de prévu pour le moment.</p>
          <p className="mt-2 text-sm text-white/50">
            Les nouvelles demandes apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 capitalize text-sm font-semibold text-white/50">
                {day}
              </h2>
              <div className="space-y-3">
                {items.map((booking) => {
                  const date = new Date(booking.availability.start_datetime);
                  const duration = Object.keys(booking.service.durations_prices)[0];
                  return (
                    <Link
                      key={String(booking.id)}
                      href={`/admin-samass-98342/bookings/${booking.id}`}
                      className="grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-emerald-400/30 hover:bg-white/[0.07] sm:grid-cols-[90px_1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-2xl font-semibold text-emerald-300">
                          {date.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {duration && (
                          <p className="mt-1 text-xs text-white/40">{duration} min</p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold">{booking.client_name}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {booking.service.title}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-amber-300/15 text-amber-200"
                        }`}
                      >
                        {booking.status === "confirmed" ? "Confirmé" : "À confirmer"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
