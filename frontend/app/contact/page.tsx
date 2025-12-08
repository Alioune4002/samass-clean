"use client";

import { useState } from "react";
import { submitContactForm } from "../../lib/api";
import { FaPhoneAlt, FaWhatsapp, FaFacebookF } from "react-icons/fa";

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
    <div className="min-h-screen flex flex-col bg-mint text-ink">
      <main className="flex-grow">
        <section className="max-w-3xl mx-auto px-6 py-16 pt-28">

          <h1 className="text-3xl md:text-4xl font-bold text-forest text-center mb-10">
            Contactez-moi
          </h1>

          
          <div className="bg-white rounded-2xl shadow-card p-8 mb-12 text-center">
            <h2 className="text-xl font-semibold text-forest mb-3">
              Me joindre directement
            </h2>

            <p className="text-softgray mb-6">
              Pour toute question ou prise de rendez-vous rapide.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+33745558731"
                className="px-4 py-3 rounded-xl bg-forest text-white flex items-center gap-2 hover:bg-leaf transition shadow-sm"
              >
                <FaPhoneAlt /> 07 45 55 87 31
              </a>

              <a
                href="https://wa.me/33745558731"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl border border-forest text-forest flex items-center gap-2 hover:bg-mint transition shadow-sm"
              >
                <FaWhatsapp /> WhatsApp
              </a>

              <a
                href="https://www.facebook.com/share/1GW8VSe5Jt/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl border border-forest text-forest flex items-center gap-2 hover:bg-mint transition shadow-sm"
              >
                <FaFacebookF /> Facebook
              </a>
            </div>
          </div>

          
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-card p-8 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-softgray border rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border-softgray border rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Téléphone (optionnel)
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border-softgray border rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest mb-1">
                Votre message *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border-softgray border rounded-xl px-4 py-3 h-32"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white py-3 rounded-xl hover:bg-leaf transition disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Envoyer le message"}
            </button>

            {response && (
              <p
                className={`text-center font-medium mt-4 ${
                  response.includes("succès") ? "text-leaf" : "text-red-600"
                }`}
              >
                {response}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
