import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#081914] px-[4vw] py-16 text-[#f1ede6]">
      <div className="grid gap-12 border-t border-white/15 pt-8 md:grid-cols-[1.4fr_.8fr_.8fr]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            SAMASS · QUIMPER
          </p>
          <h2 className="mt-6 max-w-xl text-[clamp(48px,7vw,100px)] font-bold leading-[.82] tracking-[-.07em] uppercase">
            Revenir
            <br />
            <span className="font-[Georgia] font-normal italic normal-case text-[#d7c5a8]">
              à soi.
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-3 text-sm text-white/65">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
            Explorer
          </p>
          <Link href="/services">Massages</Link>
          <Link href="/about">Approche</Link>
          <Link href="/reservation">Rendez-vous</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="text-sm leading-7 text-white/60">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
            Contact
          </p>
          <p>Quimper · Finistère</p>
          <p>07 45 55 87 31</p>
          <p>samassbysam@gmail.com</p>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-5 text-[9px] uppercase tracking-[0.16em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} SAMASS BY SAM</span>
        <span>Massage bien-être · Quimper</span>
      </div>
    </footer>
  );
}
