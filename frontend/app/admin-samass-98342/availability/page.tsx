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

      {/* --- CALENDRIER --- */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
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
    </div>
  );
}
