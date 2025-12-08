"use client";

import { useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  adminGetAvailabilities,
  adminCreateAvailability,
  adminDeleteAvailability,
} from "@/lib/adminApi";
import { Availability } from "@/lib/types";

export default function AdminAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------------------
     LOAD DATA
  ---------------------------------------------------------*/
  const loadData = async () => {
    try {
      const avs = await adminGetAvailabilities();
      setAvailabilities(avs);
    } catch (err) {
      console.error("Erreur chargement disponibilités/admin :", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* --------------------------------------------------------
     ADD AVAILABILITY
  ---------------------------------------------------------*/
  const handleDateSelect = async (select: any) => {
    const start = select.startStr;
    const end = select.endStr;

    try {
      await adminCreateAvailability({
        start_datetime: start,
        end_datetime: end,
      });

      await loadData();
    } catch (err) {
      console.error("Erreur création disponibilité :", err);
      alert("Impossible d'ajouter la disponibilité");
    }
  };

  /* --------------------------------------------------------
     DELETE AVAILABILITY
  ---------------------------------------------------------*/
  const handleEventClick = async (clickInfo: any) => {
    const id = Number(clickInfo.event.id);

    if (!confirm("Supprimer ce créneau ?")) return;

    try {
      await adminDeleteAvailability(id);
      await loadData();
    } catch (err) {
      console.error("Erreur suppression disponibilité :", err);
      alert("Impossible de supprimer le créneau.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Gestion des Disponibilités</h1>
      <p className="text-sm text-gray-300 mb-4">
        Sélectionnez un créneau horaire dans la vue semaine/jour pour créer une
        disponibilité. Un créneau réservé bloque toute la plage.
      </p>

      {/* --- CALENDRIER --- */}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          slotDuration="00:30:00"
          selectable={true}
        editable={false}
        height="auto"
        select={handleDateSelect}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={availabilities.map((a) => ({
          id: String(a.id),
          title: "Créneau libre",
          start: a.start_datetime,
          end: a.end_datetime,
        }))}
      />

      <div className="mt-8 bg-[#1A1A1A] border border-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-3">Ajouter un créneau manuel</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-[#0D0D0D] text-white p-2 rounded border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Heure début</label>
            <input
              type="time"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              className="w-full bg-[#0D0D0D] text-white p-2 rounded border border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Heure fin</label>
            <input
              type="time"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              className="w-full bg-[#0D0D0D] text-white p-2 rounded border border-gray-700"
            />
          </div>
        </div>
        <button
          onClick={async () => {
            if (!manualDate || !manualStart || !manualEnd) {
              alert("Merci de remplir date, heure début et heure fin.");
              return;
            }
            try {
              await adminCreateAvailability({
                start_datetime: `${manualDate}T${manualStart}:00`,
                end_datetime: `${manualDate}T${manualEnd}:00`,
              });
              setManualDate("");
              setManualStart("");
              setManualEnd("");
              loadData();
            } catch (err) {
              console.error(err);
              alert("Impossible d'ajouter la disponibilité.");
            }
          }}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
          >
            Ajouter ce créneau
          </button>
      </div>

      <div className="mt-8 bg-[#111111] border border-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-3">Liste des disponibilités</h3>
        {availabilities.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune disponibilité pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {availabilities.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-white">
                    {new Date(a.start_datetime).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    →{" "}
                    {new Date(a.end_datetime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Supprimer ce créneau ?")) return;
                    try {
                      await adminDeleteAvailability(a.id);
                      loadData();
                    } catch (err) {
                      console.error(err);
                      alert("Impossible de supprimer le créneau.");
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
