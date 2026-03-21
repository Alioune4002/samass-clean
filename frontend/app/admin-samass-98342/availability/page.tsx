"use client";

import { useEffect, useState } from "react";

import {
  adminGetAvailabilities,
  adminCreateAvailability,
  adminDeleteAvailability,
  adminUpdateAvailability,
  adminGetServices,
} from "@/lib/adminApi";
import { isBackendFallbackMode } from "@/lib/backendFallback";
import { Availability, Service } from "@/lib/types";
import Skeleton from "@/app/components/ui/Skeleton";

export default function AdminAvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editServiceId, setEditServiceId] = useState<number | null>(null);
  const [localMode, setLocalMode] = useState(false);

  const loadData = async () => {
    try {
      const [avs, serviceItems] = await Promise.all([
        adminGetAvailabilities(),
        adminGetServices(),
      ]);
      if (!selectedServiceId && serviceItems.length) {
        setSelectedServiceId(serviceItems[0].id);
      }
      setServices(serviceItems);
      setLocalMode(isBackendFallbackMode());
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
      {localMode && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Mode local actif : les disponibilites sont enregistrees dans ce
          navigateur tant que le backend est indisponible.
        </div>
      )}
      <p className="text-sm text-gray-300 mb-4">
        Ajoutez des créneaux horaires (début/fin). Un créneau réservé bloque
        toute la plage. Vous pouvez modifier ou supprimer chaque créneau.
      </p>

      <div className="mt-6 bg-[#1A1A1A] border border-gray-800 p-4 rounded">
        <h3 className="text-lg font-semibold mb-3">Ajouter un créneau</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Service</label>
            <select
              value={selectedServiceId ?? ""}
              onChange={(e) =>
                setSelectedServiceId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full bg-[#0D0D0D] text-white p-2 rounded border border-gray-700"
            >
              {!localMode && <option value="">Tous les services</option>}
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>
          </div>
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
            if (localMode && !selectedServiceId) {
              alert("En mode local, merci d'associer le créneau à un service.");
              return;
            }
            try {
              await adminCreateAvailability({
                start_datetime: `${manualDate}T${manualStart}:00`,
                end_datetime: `${manualDate}T${manualEnd}:00`,
                service_id: selectedServiceId,
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
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#0D0D0D] border border-gray-800 rounded px-3 py-2 text-sm"
              >
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : availabilities.length === 0 ? (
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
                      <select
                        value={String(editServiceId ?? "")}
                        onChange={(e) =>
                          setEditServiceId(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="bg-[#0D0D0D] border border-gray-700 rounded px-2 py-1 text-white"
                      >
                        {!localMode && <option value="">Tous les services</option>}
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.title}
                          </option>
                        ))}
                      </select>
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
                    <div className="space-y-1">
                      <p className="text-white">
                        {formatDateTime(a.start_datetime)} → {formatTime(a.end_datetime)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {getServiceLabel(services, a.service_id)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingId === a.id ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            if (localMode && !editServiceId) {
                              alert(
                                "En mode local, merci d'associer le créneau à un service."
                              );
                              return;
                            }
                            await adminUpdateAvailability(a.id, {
                              start_datetime: editStart || a.start_datetime,
                              end_datetime: editEnd || a.end_datetime,
                              service_id: editServiceId,
                            });
                            setEditingId(null);
                            setEditStart("");
                            setEditEnd("");
                            setEditServiceId(null);
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
                          setEditServiceId(null);
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
                          setEditServiceId(a.service_id ?? null);
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

function getServiceLabel(services: Service[], serviceId?: number | null) {
  if (serviceId == null) return "Tous les services";
  return services.find((service) => service.id === serviceId)?.title || "Service local";
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
