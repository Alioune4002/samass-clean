"use client";

import { useEffect, useState } from "react";
import {
  adminDeleteMessage,
  adminGetMessages,
  adminMarkMessageRead,
  ContactMessage,
} from "@/lib/adminApi";
import Skeleton from "@/app/components/ui/Skeleton";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminGetMessages();
        setMessages(data);
        // Marque comme lu pour enlever les notifications
        const unread = data.filter((m) => !m.is_read);
        if (unread.length) {
          await Promise.all(
            unread.map((m) => adminMarkMessageRead(m.id).catch(() => null))
          );
          // Déclenche un refresh des badges
          window.dispatchEvent(new Event("admin-badges-refresh"));
          // Mets à jour l'état local
          setMessages((prev) =>
            prev.map((m) => ({ ...m, is_read: true }))
          );
        }
      } catch (err) {
        console.error("Erreur chargement messages :", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="text-white space-y-6">
      <h1 className="text-3xl font-bold mb-4">Messages reçus</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#1A1A1A] border border-gray-700 p-6 rounded-xl shadow-lg"
            >
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <p className="text-gray-400">Aucun message pour le moment.</p>
      ) : (
        <div className="space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className="bg-[#1A1A1A] border border-gray-700 p-6 rounded-xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-3 gap-3">
                <h2 className="text-lg font-semibold text-emerald-400">
                  {m.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    {new Date(m.created_at).toLocaleString("fr-FR")}
                  </span>
                  <button
                    onClick={() =>
                      adminDeleteMessage(m.id)
                        .then(() => {
                          setMessages((prev) => prev.filter((x) => x.id !== m.id));
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new Event("admin-badges-refresh"));
                          }
                        })
                        .catch((err) =>
                          console.error("Suppression message impossible :", err)
                        )
                    }
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-1">
                <span className="text-gray-500">Email :</span> {m.email}
              </p>

              {m.phone && (
                <p className="text-gray-300 text-sm mb-3">
                  <span className="text-gray-500">Téléphone :</span> {m.phone}
                </p>
              )}

              <p className="text-gray-200 whitespace-pre-line">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
