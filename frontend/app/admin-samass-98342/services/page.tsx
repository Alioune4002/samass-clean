"use client";

import { useEffect, useState } from "react";
import {
  adminGetServices,
  adminCreateService,
  adminDeleteService,
  adminUpdateService,
} from "@/lib/adminApi";
import { Service } from "@/lib/types";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* ------------------------------
     FORMULAIRE AVEC MULTI TARIFS
  ------------------------------ */
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [tarifs, setTarifs] = useState<
    { duration: string; price: string }[]
  >([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await adminGetServices();
      setServices(data);
    } catch (err) {
      console.error("Erreur adminGetServices :", err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------
      GESTION DES TARIFS DYNAMIQUES
  ------------------------------ */
  const addTarif = () => {
    setTarifs([...tarifs, { duration: "", price: "" }]);
  };

  const updateTarif = (index: number, field: "duration" | "price", value: string) => {
    const updated = [...tarifs];
    updated[index][field] = value;
    setTarifs(updated);
  };

  const removeTarif = (index: number) => {
    setTarifs(tarifs.filter((_, i) => i !== index));
  };

  /* ------------------------------
          AJOUT SERVICE
  ------------------------------ */
  const submitService = async () => {
    if (!formData.title || tarifs.length === 0) {
      alert("Veuillez remplir le nom et ajouter au moins un tarif.");
      return;
    }

    // Convertit la liste en json "durations_prices"
    const durations_prices: Record<string, number> = {};

    for (const tarif of tarifs) {
      if (!tarif.duration || !tarif.price) {
        alert("Les champs durée et prix doivent être remplis.");
        return;
      }
      durations_prices[tarif.duration] = Number(tarif.price);
    }

    try {
      await adminCreateService({
        title: formData.title,
        description: formData.description,
        durations_prices,
      });

      // Reset du formulaire
      setFormData({ title: "", description: "" });
      setTarifs([]);

      fetchServices();
    } catch (err) {
      console.error("Erreur adminCreateService :", err);
      alert("Erreur lors de l'ajout du service.");
    }
  };

  const saveEdit = async (service: Service) => {
    if (!formData.title || tarifs.length === 0) {
      alert("Veuillez remplir le nom et ajouter au moins un tarif.");
      return;
    }
    const durations_prices: Record<string, number> = {};
    for (const tarif of tarifs) {
      durations_prices[tarif.duration] = Number(tarif.price);
    }
    try {
      await adminUpdateService(service.id, {
        title: formData.title,
        description: formData.description,
        durations_prices,
      });
      setEditingId(null);
      setTarifs([]);
      setFormData({ title: "", description: "" });
      fetchServices();
    } catch (err) {
      console.error("Erreur adminUpdateService :", err);
      alert("Impossible de modifier le service.");
    }
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({ title: service.title, description: service.description });
    setTarifs(
      Object.entries(service.durations_prices || {}).map(([d, p]) => ({
        duration: d,
        price: String(p),
      }))
    );
  };

  /* ------------------------------
          SUPPRESSION
  ------------------------------ */
  const removeService = async (id: number) => {
    if (!confirm("Supprimer ce service ?")) return;

    try {
      await adminDeleteService(id);
      fetchServices();
    } catch (err) {
      console.error("Erreur adminDeleteService :", err);
      alert("Impossible de supprimer le service.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Gestion des Services</h1>

      {/* FORMULAIRE AJOUT SERVICE */}
      <div className="border border-gray-700 p-4 rounded mb-8 bg-[#1A1A1A] shadow">
        <h2 className="text-xl font-semibold mb-4">Ajouter un service</h2>

        <input
          type="text"
          placeholder="Nom du service"
          className="border bg-[#0D0D0D] text-white p-2 w-full mb-2 rounded"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="border bg-[#0D0D0D] text-white p-2 w-full mb-4 rounded"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        {/* SECTION TARIFS MULTIPLES */}
        <h3 className="text-lg font-semibold mb-2">Durées & Prix</h3>

        {tarifs.map((tarif, index) => (
          <div key={index} className="flex gap-2 mb-3">
            <input
              type="number"
              placeholder="Durée (min)"
              className="border bg-[#0D0D0D] text-white p-2 rounded w-1/2"
              value={tarif.duration}
              onChange={(e) => updateTarif(index, "duration", e.target.value)}
            />

            <input
              type="number"
              placeholder="Prix (€)"
              className="border bg-[#0D0D0D] text-white p-2 rounded w-1/2"
              value={tarif.price}
              onChange={(e) => updateTarif(index, "price", e.target.value)}
            />

            <button
              className="text-red-500"
              onClick={() => removeTarif(index)}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={addTarif}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded mb-4"
        >
          + Ajouter une durée
        </button>

        <button
          onClick={submitService}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded w-full"
        >
          Ajouter le service
        </button>
      </div>

      {/* LISTE DES SERVICES */}
      <h2 className="text-xl font-semibold mb-4">Services existants</h2>

      {loading ? (
        <p>Chargement...</p>
      ) : services.length === 0 ? (
        <p>Aucun service disponible.</p>
      ) : (
        <ul className="space-y-4">
          {services.map((service) => {
            const isEditing = editingId === service.id;
            return (
            <li
              key={service.id}
              className="border border-gray-700 p-4 rounded bg-[#1A1A1A] shadow flex justify-between"
            >
              <div className="flex-1 pr-4 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-emerald-400">
                    {service.title}
                  </h3>
                  {!service.is_active && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-200">
                      Suspendu
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <input
                      type="text"
                      className="border bg-[#0D0D0D] text-white p-2 rounded w-full"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                    <textarea
                      className="border bg-[#0D0D0D] text-white p-2 rounded w-full"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="space-y-3">
                      {tarifs.map((tarif, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="number"
                            className="border bg-[#0D0D0D] text-white p-2 rounded w-1/2"
                            value={tarif.duration}
                            onChange={(e) =>
                              updateTarif(index, "duration", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            className="border bg-[#0D0D0D] text-white p-2 rounded w-1/2"
                            value={tarif.price}
                            onChange={(e) =>
                              updateTarif(index, "price", e.target.value)
                            }
                          />
                          <button
                            className="text-red-500"
                            onClick={() => removeTarif(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addTarif}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                      >
                        + Ajouter une durée
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(service)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setTarifs([]);
                          setFormData({ title: "", description: "" });
                        }}
                        className="bg-gray-700 text-white px-3 py-2 rounded"
                      >
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300">{service.description}</p>
                    <div className="mt-2 text-sm text-gray-400">
                      {Object.entries(service.durations_prices).map(([d, p]) => (
                        <p key={d}>• {d} min — {Number(p).toFixed(2)} €</p>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 justify-start">
                <button
                  onClick={() =>
                    adminUpdateService(service.id, {
                      is_active: !service.is_active,
                    }).then(fetchServices)
                  }
                  className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
                >
                  {service.is_active ? "Suspendre" : "Réactiver"}
                </button>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(service)}
                    className="text-sm px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600"
                  >
                    Modifier
                  </button>
                )}
                <button
                  onClick={() => removeService(service.id)}
                  className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </li>
          );})}
        </ul>
      )}
    </div>
  );
}
