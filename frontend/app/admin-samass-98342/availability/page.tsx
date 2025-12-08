"use client";

import { useEffect, useState } from "react";

import {
  adminGetAvailabilities,
  adminCreateAvailability,
  adminDeleteAvailability,
  adminUpdateAvailability,
} from "@/lib/adminApi";
import { Availability } from "@/lib/types";

export default function AdminAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const loadData = async () => {
    try {
      const avs = await adminGetAvailabilities();
      setAvailabilities(
        avs.sort(
          (a, b) =>
            new Date(a.start_datetime).getTime() -
            new Date(b.start_datetime).getTime()
        )
      );
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
        Ajoutez des créneaux horaires (début/fin). Un créneau réservé bloque
        toute la plage. Vous pouvez modifier ou supprimer chaque créneau.
      </p>

      <div className="mt-6 bg-[#1A1A1A] border border-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-3">Ajouter un créneau</h3>
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
                <div className="flex-1">
                  {editingId === a.id ? (
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="date"
                        value={editStart.split("T")[0] || a.start_datetime.slice(0, 10)}
                        onChange={(e) =>
                          setEditStart(
                            `${e.target.value}T${
                              editStart.split("T")[1] || a.start_datetime.slice(11, 16)
                            }:00`
                          )
                        }
                        className="bg-[#0D0D0D] border border-gray-700 rounded px-2 py-1 text-white"
                      />
                      <input
                        type="time"
                        value={editStart.slice(11, 16) || a.start_datetime.slice(11, 16)}
                        onChange={(e) =>
                          setEditStart(
                            `${(editStart || a.start_datetime).slice(0, 10)}T${e.target.value}:00`
                          )
                        }
                        className="bg-[#0D0D0D] border border-gray-700 rounded px-2 py-1 text-white"
                      />
                      <input
                        type="time"
                        value={editEnd.slice(11, 16) || a.end_datetime.slice(11, 16)}
                        onChange={(e) =>
                          setEditEnd(
                            `${(editEnd || a.end_datetime).slice(0, 10)}T${e.target.value}:00`
                          )
                        }
                        className="bg-[#0D0D0D] border border-gray-700 rounded px-2 py-1 text-white"
                      />
                    </div>
                  ) : (
                    <p className="text-white">
                      {formatDateTime(a.start_datetime)} → {formatTime(a.end_datetime)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === a.id ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await adminUpdateAvailability(a.id, {
                              start_datetime: editStart || a.start_datetime,
                              end_datetime: editEnd || a.end_datetime,
                            });
                            setEditingId(null);
                            setEditStart("");
                            setEditEnd("");
                            loadData();
                          } catch (err) {
                            console.error(err);
                            alert("Impossible de mettre à jour.");
                          }
                        }}
                        className="text-sm px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditStart("");
                          setEditEnd("");
                        }}
                        className="text-sm px-3 py-1 rounded bg-gray-700"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(a.id);
                          setEditStart(a.start_datetime);
                          setEditEnd(a.end_datetime);
                        }}
                        className="text-sm px-3 py-1 rounded bg-gray-700"
                      >
                        Modifier
                      </button>
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
                        className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDateTime(iso: string) {
  const [date, time] = iso.split("T");
  const [y, m, d] = date.split("-");
  const hour = time?.slice(0, 5) || "";
  return `${d}/${m}/${y} ${hour}`;
}

function formatTime(iso: string) {
  const time = iso.split("T")[1] || "";
  return time.slice(0, 5);
}
