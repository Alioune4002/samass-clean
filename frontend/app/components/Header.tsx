"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/services", label: "Massages" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

function BrandMark() {
  return (
    <span className="ritual-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M32 48C22 40 18 31 32 13C46 31 42 40 32 48Z" />
        <path d="M29 49C18 49 10 43 8 32C20 31 28 36 32 46" />
        <path d="M35 49C46 49 54 43 56 32C44 31 36 36 32 46" />
        <path d="M27 48C18 44 14 36 16 25C24 27 29 34 32 44" />
        <path d="M37 48C46 44 50 36 48 25C40 27 35 34 32 44" />
      </svg>
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="ritual-header-shell">
        <div className={`ritual-header ${scrolled ? "is-scrolled" : ""}`}>
          <Link href="/" className="ritual-brand">
            <BrandMark />
            <span>
              <strong>SAMASS</strong>
              <small>Massage · Quimper</small>
            </span>
          </Link>

          <nav className="ritual-nav">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ritual-header-actions">
            <Link href="/reservation" className="ritual-header-booking">
              Rendez-vous
            </Link>

            <button
              type="button"
              className="ritual-menu-button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Fermer la navigation" : "Ouvrir la navigation"}
              aria-expanded={open}
            >
              <span className={`ritual-menu-glyph ${open ? "is-open" : ""}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className={`ritual-mobile-menu ${open ? "is-open" : ""}`}>
        <div className="ritual-mobile-menu-card">
          <p>Prendre le temps</p>
          <div className="ritual-mobile-links">
            <Link href="/">Accueil</Link>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/reservation" className="ritual-primary-link">
            Demander un rendez-vous <span>↗</span>
          </Link>
        </div>
      </div>
    </>
  );
}
