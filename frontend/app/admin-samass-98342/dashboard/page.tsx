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

        const today = bookings.filter((b: any) =>
          b.availability.start_datetime.startsWith(todayISO)
        );

        const upcoming = bookings
          .filter((b: any) => b.status !== "canceled")
          .sort(
            (a: any, b: any) =>
              new Date(a.availability.start_datetime).getTime() -
              new Date(b.availability.start_datetime).getTime()
          )
          .slice(0, 5);

        setStats({
          todayBookings: today.length,
          pending: bookings.filter((b: any) => b.status === "pending").length,
          confirmed: bookings.filter((b: any) => b.status === "confirmed").length,
          messages: messages.length,
          upcoming,
        });
      } catch (err) {
        console.error("Erreur chargement dashboard :", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="text-white space-y-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      {/* ---- CARDS STATS ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 shadow-lg"
              >
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard title="RDV aujourd'hui" value={stats.todayBookings} />
            <StatCard title="En attente" value={stats.pending} />
            <StatCard title="Confirmés" value={stats.confirmed} />
            <StatCard title="Messages reçus" value={stats.messages} />
          </>
        )}
      </div>

      {/* ---- PROCHAINS RDV ---- */}
      <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">
          Prochains rendez-vous
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-[#0D0D0D] rounded-lg border border-gray-800 shadow-lg"
              >
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : stats.upcoming.length === 0 ? (
          <p className="text-gray-500">Aucun rendez-vous prochainement.</p>
        ) : (
          <div className="space-y-4">
            {stats.upcoming.map((b: any) => (
              <div
                key={b.id}
                className="p-4 bg-[#0D0D0D] rounded-lg border border-gray-800 shadow-lg"
              >
                <p className="text-white font-semibold">{b.client_name}</p>
                <p className="text-gray-400 text-sm">{b.service.title}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(b.availability.start_datetime).toLocaleString(
                    "fr-FR"
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center justify-center">
      <h3 className="text-gray-300 text-sm">{title}</h3>
      <p className="text-4xl font-bold mt-2 text-emerald-400">{value}</p>
    </div>
  );
}
