"use client";

import { FormEvent, useEffect, useState } from "react";
import { parisToday } from "@/lib/bookingSlots";

type DisplayReview = {
  id: string; name: string; rating: number; comment: string; created_at: string;
  visit_date?: string | null; published_at?: string;
};

export default function ReviewsClient() {
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [publicName, setPublicName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [invitation, setInvitation] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInvitation(new URLSearchParams(window.location.search).get("code") || "");
  }, []);

  useEffect(() => {
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => r.json())
      .then((items: DisplayReview[]) => setReviews(Array.isArray(items) ? items : []))
      .catch(() => setReviews([]));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("Choisissez d'abord une note entre 1 et 5.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, public_name: publicName || name.split(" ")[0],
          rating, comment, visit_date: visitDate, consent, website, invitation,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "L'envoi a échoué.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#173a2e]">
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-32 md:pt-44">
        <p className="text-xs font-semibold uppercase tracking-[.26em] text-[#99754b]">SAMASS · Quimper</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight md:text-7xl">
          Vos mots, <em className="text-[#1f5b49]">vos ressentis.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6b756e]">
          Chaque expérience est personnelle. Vous avez partagé un moment chez SAMASS ?
          Votre retour est le bienvenu, quelle que soit votre impression.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-serif text-3xl">Témoignages</h2>
          <p className="mt-3 text-sm leading-6 text-[#77837a]">
            Seuls les témoignages dont les auteurs ont accepté la publication apparaissent ici.
          </p>
          <details className="mt-4 rounded-xl border border-[#ded9cb] bg-white/45 px-4 py-3 text-xs leading-6 text-[#627064]">
            <summary className="cursor-pointer font-medium text-[#315b4c]">
              Comment sont recueillis et publiés les avis ?
            </summary>
            <div className="mt-3 space-y-2">
              <p>Les avis sont déposés sur ce site ou depuis un lien envoyé après une séance.
                Ils ne sont pas publiés automatiquement et ne donnent lieu à aucune contrepartie.</p>
              <p>Sam examine les retours avant leur affichage, sans distinction de note.
                Les contenus injurieux, publicitaires, hors sujet, portant atteinte à la vie privée
                ou sans expérience identifiable peuvent être refusés, avec un motif communiqué à leur auteur.</p>
              <p>Les avis publiés sont classés du plus récent au plus ancien, avec leur date de publication
                et la date de la séance déclarée. La publication peut intervenir dans un délai maximum
                de 90 jours. Un avis reste affiché au maximum 24 mois, sauf retrait anticipé.</p>
              <p>La personne qui a rédigé un avis peut demander sa correction ou son retrait
                en écrivant à <a className="underline" href="mailto:contact@samassbysam.com">
                contact@samassbysam.com</a>. Les avis envoyés directement sur le site
                ne font pas tous l'objet d'une vérification d'identité indépendante.</p>
            </div>
          </details>
          <div className="mt-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-[24px] border border-[#dcd6c7] bg-white/65 p-7 text-sm leading-7 text-[#64756a]">
                Les premiers témoignages seront prochainement partagés ici.
              </div>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-[24px] border border-[#e0d9c9] bg-white/70 p-6">
                  <p aria-label={`${review.rating} étoiles sur 5`} className="text-xl tracking-[.14em] text-[#ac8548]">
                    {"★".repeat(review.rating)}<span className="text-[#c4c5bf]">{"☆".repeat(5 - review.rating)}</span>
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#35493d]">{review.comment}</p>
                  <p className="mt-4 text-xs font-medium text-[#77837a]">
                    {review.name} · Publié le {new Date(review.published_at || review.created_at).toLocaleDateString("fr-FR")}
                    {review.visit_date && ` · Séance le ${new Date(review.visit_date + "T12:00:00Z").toLocaleDateString("fr-FR")}`}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e1d8c8] bg-white px-6 py-9 shadow-sm md:px-9">
          {sent ? (
            <div role="status">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e2eee6] text-2xl">✓</div>
              <h2 className="font-serif text-3xl">Merci pour votre retour.</h2>
              <p className="mt-4 leading-7 text-[#66766a]">
                Votre avis a bien été reçu. Il ne sera affiché publiquement qu'avec votre accord.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-3xl">Laisser un avis</h2>
              <p className="mt-3 text-sm leading-6 text-[#758075]">
                Quelques mots suffisent pour partager votre expérience.
                Votre témoignage ne sera publié que si vous le souhaitez.
              </p>
              {invitation && (
                <p className="mt-4 rounded-xl bg-[#e7f0e8] px-4 py-3 text-sm text-[#305849]">
                  Vous utilisez une invitation personnelle. Indiquez l'adresse email
                  sur laquelle vous avez reçu cette invitation.
                </p>
              )}
              <form onSubmit={submit} className="mt-7 space-y-5">
                <div>
                  <label className="block text-sm font-medium" htmlFor="review-name">Votre nom</label>
                  <input id="review-name" required minLength={2} maxLength={70} value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl border border-[#d4d1c9] px-4 py-3 outline-none focus:border-[#1f5b49]"/>
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="review-email">Votre email (non public)</label>
                  <input id="review-email" type="email" required maxLength={254} value={email}
                    onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                    className="mt-2 w-full rounded-xl border border-[#d4d1c9] px-4 py-3 outline-none focus:border-[#1f5b49]"/>
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="review-visit-date">Date de votre séance</label>
                  <input id="review-visit-date" type="date" required value={visitDate}
                    max={parisToday()}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d4d1c9] px-4 py-3 outline-none focus:border-[#1f5b49]" />
                </div>
                <fieldset>
                  <legend className="text-sm font-medium">Votre appréciation</legend>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)}
                        className={`text-3xl ${star <= rating ? "text-[#b2894a]" : "text-[#d0d2ce]"}`}
                        aria-label={`Choisir ${star} étoile${star > 1 ? "s" : ""}`}
                        aria-pressed={rating === star}>★</button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className="block text-sm font-medium" htmlFor="review-text">Votre expérience</label>
                  <textarea id="review-text" required minLength={20} maxLength={1400} rows={5}
                    value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Comment s'est passé votre moment chez SAMASS ?"
                    className="mt-2 w-full rounded-xl border border-[#d4d1c9] px-4 py-3 outline-none focus:border-[#1f5b49]"/>
                  <p className="mt-1 text-xs text-[#7a8279]">Évitez toute information personnelle ou sensible.</p>
                </div>
                <label className="flex items-start gap-3 text-sm leading-6 text-[#526056]">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1.5 h-4 w-4 accent-[#1f5b49]"/>
                  J'accepte que mon avis et mon prénom choisi soient publiés sur le site SAMASS.
                </label>
                {consent && (
                  <div>
                    <label className="block text-sm font-medium" htmlFor="review-public-name">Nom affiché publiquement</label>
                    <input id="review-public-name" maxLength={70} value={publicName}
                      onChange={(e) => setPublicName(e.target.value)}
                      placeholder={name.split(" ")[0] || "Votre prénom"}
                      className="mt-2 w-full rounded-xl border border-[#d4d1c9] px-4 py-3 outline-none focus:border-[#1f5b49]"/>
                  </div>
                )}
                <div aria-hidden="true" className="absolute -left-[10000px]">
                  <label htmlFor="review-website">Site web</label>
                  <input id="review-website" autoComplete="off" tabIndex={-1} value={website}
                    onChange={(e) => setWebsite(e.target.value)}/>
                </div>
                <p className="text-xs leading-5 text-[#78867b]">
                  Sans votre accord, le retour reste privé. Votre email sert au suivi et n'est jamais affiché.
                  Vous pouvez demander sa suppression à contact@samassbysam.com.
                </p>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={busy} className="w-full rounded-full bg-[#1e5545] px-6 py-3.5 font-medium text-white disabled:opacity-60">
                  {busy ? "Envoi en cours…" : "Envoyer mon avis"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
