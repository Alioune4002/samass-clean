"use client";

import { useState } from "react";
import { submitContactForm } from "../../lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseTone, setResponseTone] = useState<"success" | "error">("success");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const result = await submitContactForm(form);
      setResponse(result.message);
      setResponseTone("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setResponse("Impossible d’envoyer le message pour le moment.");
      setResponseTone("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ece7de] text-[#101512]">
      <section className="px-[5vw] pb-[10vh] pt-[22vh]">
        <p className="samass-kicker text-black/40">CONTACT · SAMASS</p>
        <h1 className="mt-8 max-w-[1200px] text-[clamp(72px,11vw,170px)] font-extrabold uppercase leading-[.74] tracking-[-.085em]">
          Parlons de
          <br />
          <span className="ml-[13vw] font-[Georgia] font-normal italic normal-case text-[#356c59]">
            ce qu’il vous faut.
          </span>
        </h1>
      </section>

      <section className="grid border-t border-black/15 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="border-b border-black/15 px-[5vw] py-[9vh] lg:border-b-0 lg:border-r">
          <p className="samass-kicker text-black/35">EN DIRECT</p>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-[10px] uppercase tracking-[.16em] text-black/35">
                Téléphone
              </p>
              <a
                href="tel:+33745558731"
                className="mt-2 block text-3xl font-bold tracking-[-.04em]"
              >
                07 45 55 87 31
              </a>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[.16em] text-black/35">
                Email
              </p>
              <a
                href="mailto:samassbysam@gmail.com"
                className="mt-2 block break-all text-xl font-semibold"
              >
                samassbysam@gmail.com
              </a>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[.16em] text-black/35">
                Lieu
              </p>
              <p className="mt-2 text-xl font-semibold">Quimper · Finistère</p>
            </div>

            <div className="border-t border-black/15 pt-7 text-sm leading-6 text-black/50">
              Une question sur un massage, une hésitation sur la durée ou une
              contrainte horaire particulière ? Écrivez simplement comme vous
              parleriez à Sam.
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="bg-[#0d1d18] px-[5vw] py-[9vh] text-[#f2eee7]">
          <p className="samass-kicker text-white/35">VOTRE MESSAGE</p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Nom *
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-3 w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-xl text-white outline-none transition focus:border-white/60"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                Email *
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-3 w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-xl text-white outline-none transition focus:border-white/60"
              />
            </label>
          </div>

          <label className="mt-8 block">
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
              Téléphone
            </span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-3 w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-xl text-white outline-none transition focus:border-white/60"
            />
          </label>

          <label className="mt-8 block">
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
              Votre message *
            </span>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Parlez-moi de ce que vous recherchez, de vos disponibilités ou de votre hésitation."
              className="mt-3 w-full resize-none border-0 border-b border-white/20 bg-transparent px-0 py-4 text-xl leading-8 text-white outline-none placeholder:text-white/20 transition focus:border-white/60"
            />
          </label>

          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={loading}
              className="w-max border-b border-white pb-2 text-sm font-bold disabled:opacity-40"
            >
              {loading ? "Envoi…" : "Envoyer le message ↗"}
            </button>

            {response && (
              <p
                className={`max-w-sm text-sm ${
                  responseTone === "success" ? "text-[#a7c4b1]" : "text-red-300"
                }`}
              >
                {response}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
