"use client";

import { useEffect, useState } from "react";
import { adminGetBookings, adminGetMessages } from "@/lib/adminApi";
import { Booking } from "@/lib/types";
import Skeleton from "@/app/components/ui/Skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    pending: 0,
    confirmed: 0,
    messages: 0,
    upcoming: [] as Booking[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bookings, messages] = await Promise.all([
          adminGetBookings(),
          adminGetMessages(),
        ]);

        const todayISO = new Date().toISOString().slice(0, 10);
        const confirmed = bookings.filter((booking) => booking.status === "confirmed");

        setStats({
          todayBookings: confirmed.filter((booking) =>
            booking.availability.start_datetime.startsWith(todayISO)
          ).length,
          pending: bookings.filter((booking) => booking.status === "pending").length,
          confirmed: confirmed.length,
          messages: messages.length,
          upcoming: confirmed
            .filter(
              (booking) =>
                new Date(booking.availability.start_datetime).getTime() >= Date.now()
            )
            .sort(
              (a, b) =>
                new Date(a.availability.start_datetime).getTime() -
                new Date(b.availability.start_datetime).getTime()
            )
            .slice(0, 5),
        });
      } catch (err) {
        console.error("Erreur chargement dashboard :", err);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-8 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-400/70">
          Espace Sam
        </p>
        <h1 className="mt-2 text-3xl font-bold">Vue d’ensemble</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
                <Skeleton className="mb-3 h-4 w-2/3" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))
          : <>
              <StatCard title="RDV aujourd’hui" value={stats.todayBookings} />
              <StatCard title="Demandes à traiter" value={stats.pending} />
              <StatCard title="Confirmés" value={stats.confirmed} />
              <StatCard title="Messages" value={stats.messages} />
            </>}
      </div>

      <section className="rounded-[28px] border border-white/10 bg-white/[.04] p-6">
        <h2 className="text-xl font-semibold text-emerald-300">
          Prochains rendez-vous confirmés
        </h2>

        {loading ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : stats.upcoming.length === 0 ? (
          <p className="mt-5 text-white/45">Aucun rendez-vous confirmé à venir.</p>
        ) : (
          <div className="mt-5 divide-y divide-white/10">
            {stats.upcoming.map((booking) => (
              <div key={booking.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto]">
                <div>
                  <strong>{booking.client_name}</strong>
                  <p className="mt-1 text-sm text-white/50">{booking.service.title}</p>
                </div>
                <time className="text-sm text-emerald-300/80">
                  {new Date(booking.availability.start_datetime).toLocaleString("fr-FR")}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
      <h3 className="text-sm text-white/50">{title}</h3>
      <p className="mt-3 text-4xl font-semibold text-emerald-300">{value}</p>
    </div>
  );
}
