"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/services", label: "Massages" },
  { href: "/about", label: "L’approche" },
  { href: "/contact", label: "Contact" },
];

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
            <span className="ritual-brand-mark" aria-hidden="true">
              <img src="/brand/samass-mark.svg" alt="" />
            </span>
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
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
            >
              {open ? "Fermer" : "Menu"}
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
