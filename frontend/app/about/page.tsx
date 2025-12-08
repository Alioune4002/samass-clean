import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "À propos – SAMASS",
  description:
    "Découvrez l’approche de SAMASS : massages sur-mesure, présence et écoute pour vous aider à relâcher corps et esprit.",
};

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white text-ink">
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-16 grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">
            À propos
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-forest leading-tight">
            Une approche douce, attentive et profondément humaine.
          </h1>
          <p className="text-softgray text-lg leading-relaxed">
            Je m’appelle Sam. J’accompagne les personnes qui souhaitent
            reprendre contact avec leur corps, apaiser leurs tensions et se
            reconnecter à leurs sensations. Chaque massage est adapté à votre
            énergie du moment : pas de protocole rigide, seulement de la
            présence, de l’écoute et des gestes sur-mesure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center rounded-full bg-forest text-white px-5 py-3 font-semibold hover:bg-leaf transition"
            >
              Prendre rendez-vous
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-forest text-forest px-5 py-3 font-semibold hover:bg-pastel transition"
            >
              Voir les massages
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full">
          <Image
            src="/images/about1.jpg"
            alt="Espace de massage Samass"
            fill
            className="rounded-3xl object-cover shadow-xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur rounded-2xl px-4 py-3 shadow-lg border border-emerald-50 text-sm text-forest">
            Massages bien-être à Quimper · Présence & écoute
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-emerald-50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Présence",
              text: "Un cadre sécurisant où vous pouvez réellement vous déposer, respirer et vous détendre.",
              icon: "🤲",
            },
            {
              title: "Personnalisation",
              text: "Chaque séance est adaptée : rythme, pression, durée et zones ciblées selon vos besoins.",
              icon: "✨",
            },
            {
              title: "Régularité",
              text: "Un accompagnement dans le temps pour libérer les tensions et retrouver de l’énergie.",
              icon: "🌿",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-forest mb-2">
                {item.title}
              </h3>
              <p className="text-softgray text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid gap-10 lg:grid-cols-2 items-start">
        <div className="space-y-4 order-1 lg:order-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-forest">
            Mon intention pour vous
          </h2>
          <p className="text-softgray leading-relaxed">
            Vous offrir un moment où vous pouvez relâcher la pression,
            respirer plus librement et retrouver du confort dans votre corps.
            J’utilise des huiles naturelles, une gestuelle douce et des
            techniques inspirées du massage relaxant, tonique et tantrique.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-emerald-100 p-4 text-sm">
              <p className="font-semibold text-forest">Massages relaxants</p>
              <p className="text-softgray mt-1">
                Pour apaiser le système nerveux et libérer les tensions
                profondes.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-emerald-100 p-4 text-sm">
              <p className="font-semibold text-forest">Massages toniques</p>
              <p className="text-softgray mt-1">
                Pour redynamiser le corps, stimuler la circulation et détendre
                les muscles fatigués.
              </p>
            </div>
          </div>
        </div>
        <div className="order-2 lg:order-2 bg-gradient-to-b from-emerald-50 to-white border border-emerald-50 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-forest mb-2">Ce que vous pouvez attendre</h3>
          <ul className="text-softgray space-y-2 text-sm">
            <li>• Accueil en douceur, respect et écoute</li>
            <li>• Choix du rythme et de la pression adaptés à votre corps</li>
            <li>• Huiles naturelles et ambiance calme</li>
            <li>• Possibilité de massages plus longs selon votre besoin</li>
          </ul>
        </div>
      </section>

      <section className="bg-forest text-white">
        <div className="max-w-6xl mx-auto px-6 py-14 grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Envie d&apos;échanger ?</h3>
            <p className="text-white/80 leading-relaxed">
              Parlez-moi de vos besoins, de vos douleurs ou simplement de ce que
              vous aimeriez ressentir après la séance. Nous trouverons le
              massage qui vous convient.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/reservation"
                className="inline-flex items-center justify-center rounded-full bg-white text-forest px-5 py-2.5 font-semibold hover:bg-emerald-50 transition"
              >
                Réserver un créneau
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white text-white px-5 py-2.5 font-semibold hover:bg-white/10 transition"
              >
                Me contacter
              </Link>
            </div>
          </div>

          <div className="relative aspect-[16/10] w-full">
            <Image
              src="/images/about3.png"
              alt="Ambiance Samass"
              fill
              className="rounded-2xl object-cover shadow-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
