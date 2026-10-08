import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "À propos — Sam & l’approche SAMASS",
  description:
    "Découvrez l’approche SAMASS à Quimper : un accueil attentionné, des massages sur mesure et un espace privé dédié à la détente.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#ece7de] text-[#101512]">
      <section className="min-h-[88svh] px-[5vw] pb-[10vh] pt-[22vh]">
        <p className="samass-kicker text-black/40">SAM · L’APPROCHE</p>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <h1 className="text-[clamp(68px,11vw,165px)] font-extrabold uppercase leading-[.76] tracking-[-.08em]">
            Un massage
            <br />
            <span className="ml-[9vw] font-[Georgia] font-normal italic normal-case text-[#356c59]">
              vraiment personnel.
            </span>
          </h1>

          <p className="max-w-md pb-4 text-lg leading-8 text-black/58">
            À Quimper, SAMASS vous accueille dans un espace privé, chaleureux
            et apaisant, pensé pour vous offrir une véritable parenthèse de
            détente. Chaque rendez-vous est un moment qui vous est consacré.
          </p>
        </div>
      </section>

      <section className="grid bg-[#0b3f32] text-[#f2eee7] lg:grid-cols-[.92fr_1.08fr]">
        <div className="relative min-h-[76vh] overflow-hidden lg:rounded-r-[76px]">
          <Image
            src="/images/samass-host-final.webp"
            alt="Sam préparant l’espace de massage"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-[7vw] py-[12vh]">
          <p className="samass-kicker text-white/40">QUI VOUS ACCUEILLE</p>
          <h2 className="mt-7 font-[Georgia] text-[clamp(58px,7vw,105px)] font-normal leading-[.9] tracking-[-.055em]">
            Sam,
            <br />
            simplement.
          </h2>

          <div className="mt-10 max-w-xl space-y-5 text-[17px] leading-8 text-white/62">
            <p>
              Chez SAMASS, vous êtes accueilli par Sam, votre praticien,
              formé à l’Hypoténuse, École française du massage. Avant chaque
              séance, un temps d’échange permet de comprendre vos attentes
              et de choisir le rythme qui vous convient.
            </p>
            <p>
              Une présence attentive, des gestes adaptés et le plaisir de
              prendre le temps. Ici, tout invite à ralentir, à relâcher les
              tensions et à profiter pleinement de votre séance.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl border-t border-white/15 text-[10px] font-bold uppercase tracking-[.13em] text-white/55 sm:grid-cols-3">
            <span className="border-b border-white/15 py-4 sm:border-r sm:px-4 sm:first:pl-0">
              Accueil personnalisé
            </span>
            <span className="border-b border-white/15 py-4 sm:border-r sm:px-4">
              Praticien formé
            </span>
            <span className="border-b border-white/15 py-4 sm:px-4">
              À Quimper
            </span>
          </div>
        </div>
      </section>

      <section className="px-[5vw] py-[15vh]">
        <p className="samass-kicker text-black/40">CE QUI GUIDE LA SÉANCE</p>

        <div className="mt-10 grid border-t border-black/15 md:grid-cols-3">
          {[
            [
              "01",
              "Présence",
              "Prendre le temps d’écouter ce que le corps exprime, sans précipiter ni forcer.",
            ],
            [
              "02",
              "Échange",
              "Poser un cadre clair avant de commencer et pouvoir dire simplement ce qui convient ou non.",
            ],
            [
              "03",
              "Adaptation",
              "Faire évoluer pression, rythme et gestes selon votre état et votre ressenti.",
            ],
          ].map(([index, title, text]) => (
            <article
              key={title}
              className="min-h-[330px] border-b border-black/15 py-7 md:border-r md:px-7 first:pl-0 last:border-r-0"
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

      <section className="grid bg-[#dfe5df] lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-[6vw] py-[12vh]">
          <p className="samass-kicker text-black/40">LE LIEU</p>
          <blockquote className="mt-8 font-[Georgia] text-[clamp(48px,6vw,90px)] font-normal leading-[.93] tracking-[-.055em]">
            Un lieu pour
            <br />
            <span className="italic text-[#0f5a43]">souffler.</span>
          </blockquote>

          <p className="mt-9 max-w-md text-[16px] leading-8 text-black/58">
            Un espace privé dédié au massage et au bien-être, à Quimper.
            Lumière douce, atmosphère feutrée et linge confortable : chaque
            détail est pensé pour accompagner votre détente.
          </p>

          <Link
            href="/reservation"
            className="mt-10 w-max border-b border-black pb-2 text-sm font-bold"
          >
            Demander un rendez-vous ↗
          </Link>
        </div>

        <div className="relative min-h-[70vh]">
          <Image
            src="/images/samass-room-final-2.webp"
            alt="Le cocon SAMASS préparé pour une séance"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      </section>
    </div>
  );
}
