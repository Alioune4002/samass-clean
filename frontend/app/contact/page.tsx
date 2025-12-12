"use client";

import { useState } from "react";
import { submitContactForm } from "../../lib/api";
import { FaPhoneAlt, FaWhatsapp, FaFacebookF } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const result = await submitContactForm(form);
      setResponse("Message envoyé avec succès. Je vous répondrai très vite.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error(err);
      setResponse("Impossible d’envoyer le message pour le moment.");
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-ink overflow-hidden">
      <div className="absolute -left-24 -top-20 w-72 h-72 rounded-full bg-emerald-200 blur-3xl opacity-60" />
      <div className="absolute right-[-80px] top-10 w-80 h-80 rounded-full bg-forest/10 blur-3xl opacity-50" />
      <main className="flex-grow relative z-10">
        <section className="max-w-5xl mx-auto px-6 py-16 pt-28 space-y-10">
          <div className="text-center space-y-4">
            <motion.h1
              className="text-3xl md:text-5xl font-bold text-forest"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Contactez-moi
            </motion.h1>
            <motion.p
              className="text-gray-600 max-w-2xl mx-auto text-lg"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Une question, un besoin précis ou une envie de réserver ? Écrivez-moi et je vous réponds rapidement.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-[1fr_1.1fr] gap-6">
            <motion.div
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-emerald-100 p-8 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-forest mb-1">
                Me joindre directement
              </h2>
              <p className="text-softgray">
                Pour toute question ou prise de rendez-vous rapide.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="tel:+33745558731"
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition"
                >
                  <FaPhoneAlt /> 07 45 55 87 31
                </a>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://wa.me/33745558731"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 hover:bg-emerald-50 transition shadow-sm"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>

                  <a
                    href="https://www.facebook.com/share/1GW8VSe5Jt/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-2xl border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 hover:bg-emerald-50 transition shadow-sm"
                  >
                    <FaFacebookF /> Facebook
                  </a>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm text-forest font-semibold mb-1">
                  Délais de réponse
                </p>
                <p className="text-softgray text-sm">
                  Je réponds généralement sous 2h (10h-20h). Pour un créneau urgent, privilégiez l’appel.
                </p>
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-emerald-100 p-8 space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-forest">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-emerald-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-forest">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-emerald-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-forest">
                  Téléphone (optionnel)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-emerald-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-forest">
                  Votre message *
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-emerald-100 rounded-2xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </button>

              {response && (
                <p
                  className={`text-center font-medium mt-2 ${
                    response.includes("succès") ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {response}
                </p>
              )}
            </motion.form>
          </div>
        </section>
      </main>
    </div>
  );
}
