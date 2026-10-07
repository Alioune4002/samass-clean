import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "L’approche – SAMASS",
  description:
    "Découvrez l’approche SAMASS : présence, écoute et massages sur-mesure à Quimper.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#ece7de] text-[#101512]">
      <section className="min-h-[88svh] px-[5vw] pb-[10vh] pt-[22vh]">
        <p className="samass-kicker text-black/40">L’APPROCHE · SAMASS</p>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <h1 className="text-[clamp(70px,11vw,170px)] font-extrabold uppercase leading-[.75] tracking-[-.08em]">
            Être là.
            <br />
            <span className="ml-[10vw] font-[Georgia] font-normal italic normal-case text-[#356c59]">
              Vraiment.
            </span>
          </h1>
          <p className="max-w-md pb-4 text-lg leading-8 text-black/58">
            Chez SAMASS, le massage commence avant le premier geste : par une
            écoute réelle, un cadre clair et la liberté de ralentir sans avoir
            quoi que ce soit à prouver.
          </p>
        </div>
      </section>

      <section className="grid bg-[#0d1d18] text-[#f2eee7] lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative min-h-[72vh]">
          <Image
            src="/images/samass-room-realistic-1.webp"
            alt="L’espace SAMASS"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover saturate-[.65]"
          />
        </div>
        <div className="flex flex-col justify-center px-[6vw] py-[12vh]">
          <p className="samass-kicker text-white/35">SAM</p>
          <h2 className="mt-8 text-[clamp(55px,7vw,105px)] font-bold uppercase leading-[.82] tracking-[-.07em]">
            Pas de
            <br />
            protocole
            <br />
            <span className="font-[Georgia] font-normal italic normal-case text-[#d7c5a8]">
              automatique.
            </span>
          </h2>
          <p className="ml-auto mt-12 max-w-md text-base leading-7 text-white/55">
            Chaque personne arrive avec une fatigue, une tension, une envie et
            une histoire différentes. La séance s’adapte donc au rythme, à la
            pression et aux zones qui demandent de l’attention ce jour-là.
          </p>
        </div>
      </section>

      <section className="px-[5vw] py-[15vh]">
        <p className="samass-kicker text-black/40">CE QUI GUIDE LA SÉANCE</p>
        <div className="mt-10 grid border-t border-black/15 md:grid-cols-3">
          {[
            ["01", "Présence", "Être attentif à ce que le corps exprime, sans précipiter ni forcer."],
            ["02", "Écoute", "Créer un cadre où vous pouvez dire ce qui convient, ce qui change et ce dont vous avez besoin."],
            ["03", "Adaptation", "Faire évoluer pression, rythme et durée pour que la séance reste juste jusqu’au bout."],
          ].map(([index, title, text]) => (
            <article
              key={title}
              className="min-h-[340px] border-b border-black/15 py-7 md:border-r md:px-7 first:pl-0 last:border-r-0"
            >
              <span className="text-[10px] tracking-[.16em] text-black/35">
                {index}
              </span>
              <h3 className="mt-16 text-4xl font-bold uppercase tracking-[-.05em]">
                {title}
              </h3>
              <p className="mt-6 max-w-sm leading-7 text-black/55">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid bg-[#d7c9b6] lg:grid-cols-[.8fr_1.2fr]">
        <div className="flex flex-col justify-center px-[6vw] py-[12vh]">
          <p className="samass-kicker text-black/40">L’INTENTION</p>
          <blockquote className="mt-8 text-[clamp(46px,6vw,88px)] font-bold leading-[.93] tracking-[-.055em]">
            Créer un endroit où le corps peut enfin
            <span className="font-[Georgia] font-normal italic text-[#356c59]">
              {" "}cesser de tenir.
            </span>
          </blockquote>
          <Link
            href="/reservation"
            className="mt-12 w-max border-b border-black pb-2 text-sm font-bold"
          >
            Demander un rendez-vous ↗
          </Link>
        </div>
        <div className="relative min-h-[70vh]">
          <Image
            src="/images/samass-room-realistic-2.webp"
            alt="Atmosphère de massage SAMASS"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        </div>
      </section>
    </div>
  );
}
