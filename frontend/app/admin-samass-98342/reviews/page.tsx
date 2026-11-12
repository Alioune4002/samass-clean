"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Review = {
  kind: "review" | "invitation";
  id: string;
  name: string;
  email: string;
  rating?: number;
  comment?: string;
  public_name?: string;
  consent?: boolean;
  status: "pending" | "published" | "hidden" | "sent" | "failed";
  created_at: string;
};

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const response = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger les avis.");
    const values = await response.json() as Review[];
    setRows(values);
  }, []);

  useEffect(() => {
    reload().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [reload]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Envoi impossible.");
      setMessage("Invitation envoyée à " + email + ". Le lien mène à la page /avis.");
      setName("");
      setEmail("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  async function change(id: string, action: "publish" | "hide") {
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action impossible.");
      await reload();
      setMessage(action === "publish" ? "Témoignage publié." : "Témoignage masqué.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    }
  }

  const reviews = rows.filter((row) => row.kind === "review");
  const invitations = rows.filter((row) => row.kind === "invitation");

  return (
    <div className="max-w-5xl space-y-9 text-gray-100">
      <div>
        <p className="text-xs uppercase tracking-[.25em] text-emerald-400">SAMASS · Administration</p>
        <h1 className="mt-2 text-3xl font-semibold">Avis clients</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Envoyer une invitation après une véritable séance, puis retrouver les avis déposés.
          Les retours peuvent être positifs ou négatifs. Ils restent privés sans accord de publication.
        </p>
        <Link href="/avis" target="_blank" className="mt-3 inline-block text-sm text-emerald-300 underline">
          Voir la page publique des avis
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-800 bg-[#1b1b1b] p-5 md:p-7">
        <h2 className="text-xl font-semibold">Demander un avis après une séance</h2>
        <p className="mt-2 text-sm text-gray-400">
          Saisis les coordonnées d'un client réellement accueilli chez SAMASS.
          Un email sera envoyé immédiatement depuis la messagerie configurée.
        </p>
        <form onSubmit={invite} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
          <input required minLength={2} maxLength={70} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Prénom et nom du client" aria-label="Nom du client"
            className="min-w-0 rounded-lg border border-gray-700 bg-[#101010] p-3 text-sm text-white"/>
          <input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.fr" aria-label="Adresse du client"
            className="min-w-0 rounded-lg border border-gray-700 bg-[#101010] p-3 text-sm text-white"/>
          <button disabled={sending} type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
        <p className="mt-3 text-xs leading-5 text-gray-500">
          Ne demande pas uniquement des avis positifs et n'offre aucun avantage en échange.
          Le massage effectué n'est pas précisé dans l'email, par discrétion.
        </p>
      </section>

      {message && <p role="status" className="rounded-xl border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-200">{error}</p>}

      <section>
        <h2 className="text-2xl font-semibold">Témoignages reçus <span className="text-gray-400">({reviews.length})</span></h2>
        {loading ? <p className="mt-4 text-gray-400">Chargement…</p> : reviews.length === 0 ? (
          <p className="mt-4 rounded-xl border border-gray-800 p-5 text-sm text-gray-400">Aucun témoignage reçu pour l'instant.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-gray-800 bg-[#1b1b1b] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{review.name} <span className="ml-2 text-sm font-normal text-gray-400">{review.email}</span></p>
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs">{review.status === "pending" ? "En attente" : review.status === "published" ? "Publié" : "Masqué"}</span>
                </div>
                <p className="mt-2 text-lg text-amber-300">{"★".repeat(review.rating || 0)}<span className="text-gray-600">{"☆".repeat(5 - (review.rating || 0))}</span></p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-200">{review.comment}</p>
                <p className="mt-3 text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("fr-FR")} ·
                  Accord de publication : <strong className={review.consent ? "text-emerald-300" : "text-gray-400"}>{review.consent ? "Oui" : "Non"}</strong>
                  {review.consent && review.public_name ? " · Nom public : " + review.public_name : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.status !== "published" && review.consent && (
                    <button onClick={() => change(review.id, "publish")}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">Publier</button>
                  )}
                  {review.status !== "hidden" && (
                    <button onClick={() => change(review.id, "hide")}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200">Masquer</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Invitations envoyées ({invitations.length})</h2>
        <div className="mt-3 space-y-2">
          {invitations.length === 0 ? <p className="text-sm text-gray-400">Aucune invitation envoyée.</p> : invitations.map((item) => (
            <div key={item.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-gray-800 px-4 py-3 text-sm">
              <span>{item.name} · <span className="text-gray-400">{item.email}</span></span>
              <span className="text-gray-400">{new Date(item.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
