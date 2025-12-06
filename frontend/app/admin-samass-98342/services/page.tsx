"use client";

import { useEffect, useState } from "react";
import {
  adminGetServices,
  adminCreateService,
  adminDeleteService,
} from "@/lib/adminApi";

/* ------------------------------
   TYPE EXACT DU BACKEND DJANGO
------------------------------ */
type Service = {
  id: number;
  title: string;
  description: string;
  durations_prices: Record<string, number>;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------
     FORMULAIRE AVEC MULTI TARIFS
  ------------------------------ */
  const [formData, setFormData] = useState({
    name: "",
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
    if (!formData.name || tarifs.length === 0) {
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
        title: formData.name,
        description: formData.description,
        durations_prices,
      });

      // Reset du formulaire
      setFormData({ name: "", description: "" });
      setTarifs([]);

      fetchServices();
    } catch (err) {
      console.error("Erreur adminCreateService :", err);
      alert("Erreur lors de l'ajout du service.");
    }
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
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              placeholder="Prix (centimes)"
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
          {services.map((service) => (
            <li
              key={service.id}
              className="border border-gray-700 p-4 rounded bg-[#1A1A1A] shadow flex justify-between"
            >
              <div>
                <h3 className="font-bold text-emerald-400">{service.title}</h3>
                <p className="text-gray-300">{service.description}</p>

                <div className="mt-2 text-sm text-gray-400">
                  {Object.entries(service.durations_prices).map(([d, p]) => (
                    <p key={d}>• {d} min — {(p / 100).toFixed(2)} €</p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => removeService(service.id)}
                className="text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
