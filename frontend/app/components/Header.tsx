"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "À Propos" },
  { href: "/contact", label: "Contact" },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span
        className={`absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-slate-900 transition ${
          open ? "translate-y-1.5 rotate-45" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-slate-900 transition ${
          open ? "opacity-0" : ""
        }`}
      />
      <span
        className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-slate-900 transition ${
          open ? "-translate-y-1.5 -rotate-45" : ""
        }`}
      />
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed left-0 top-0 z-40 w-full border-b transition-all backdrop-blur-xl ${
        scrolled
          ? "border-slate-200/80 bg-white/86"
          : "border-transparent bg-white/68"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-2xl font-bold text-forest transition-opacity hover:opacity-90"
        >
          <Image
            src="/images/samass-logo.jpeg"
            alt="SAMASS"
            width={56}
            height={56}
            className="rounded-full object-cover md:h-14 md:w-14"
          />
          <span className="text-[1.55rem] font-semibold tracking-tight text-forest">
            SAMASS
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-700 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/88 text-slate-900 transition hover:border-slate-300 hover:bg-white md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <HamburgerIcon open={open} />
        </button>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200/80 bg-white/96 px-5 pb-5 pt-4 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-2 rounded-[26px] border border-slate-200/80 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[18px] px-4 py-3 text-[15px] font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-forest"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
