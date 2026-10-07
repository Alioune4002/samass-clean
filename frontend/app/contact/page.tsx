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
    <div className="ritual-contact-page">
      <section className="ritual-contact-hero">
        <p className="ritual-eyebrow">CONTACT · QUIMPER</p>
        <h1>
          Une question
          <br />
          avant de <em>ralentir ?</em>
        </h1>
        <p>
          Vous pouvez écrire comme vous parleriez à Sam : votre hésitation,
          votre besoin du moment, une question sur le tantrique ou simplement
          vos disponibilités.
        </p>
      </section>

      <section className="ritual-contact-grid">
        <aside className="ritual-contact-details">
          <div>
            <small>Téléphone</small>
            <a href="tel:+33745558731">07 45 55 87 31</a>
          </div>
          <div>
            <small>Email</small>
            <a href="mailto:contact@samassbysam.com">contact@samassbysam.com</a>
          </div>
          <div>
            <small>Lieu</small>
            <span>Quimper · Finistère</span>
          </div>
          <div className="ritual-contact-note">
            Pour une question précise sur le massage tantrique, le cadre ou
            votre confort, vous pouvez la poser directement ici. Aucune
            formulation particulière n’est nécessaire.
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="ritual-contact-form">
          <p className="ritual-eyebrow">VOTRE MESSAGE</p>

          <div className="ritual-contact-fields two">
            <label>
              <span>Nom *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span>Email *</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>

          <div className="ritual-contact-fields">
            <label>
              <span>Téléphone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              <span>Votre message *</span>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Ce que vous recherchez, ce qui vous fait hésiter ou vos disponibilités…"
              />
            </label>
          </div>

          <div className="ritual-contact-submit">
            <button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le message"} <span>↗</span>
            </button>
            {response ? (
              <p className={responseTone === "success" ? "is-success" : "is-error"}>
                {response}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
