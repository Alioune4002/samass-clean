"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/services", label: "Massages" },
  { href: "/about", label: "Approche" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-[#081914]/88 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-[4vw] py-5 text-[#f2eee7]">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="text-[20px] font-extrabold tracking-[-0.04em]">
              SAMASS
            </span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45 sm:block">
              Revenir à soi
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[10px] font-bold uppercase tracking-[0.16em] md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/68 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/reservation"
              className="border border-white/35 px-4 py-3 text-white transition hover:bg-white hover:text-[#081914]"
            >
              Rendez-vous ↗
            </Link>
          </nav>

          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="border border-white/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] md:hidden"
          >
            {open ? "Fermer" : "Menu"}
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-[#081914] px-5 pb-8 pt-28 text-[#f2eee7] transition-all duration-300 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <p className="mb-8 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
          Navigation
        </p>
        <div className="border-t border-white/15">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between border-b border-white/15 py-5"
            >
              <span className="text-[12vw] font-bold leading-none tracking-[-0.06em] uppercase">
                {item.label}
              </span>
              <span className="text-xs text-white/35">0{index + 1}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/reservation"
          className="mt-10 inline-flex border-b border-white pb-2 text-lg font-semibold"
        >
          Demander un rendez-vous ↗
        </Link>
      </div>
    </>
  );
}
