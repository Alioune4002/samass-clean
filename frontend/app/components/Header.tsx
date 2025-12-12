
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-40 transition-all backdrop-blur-md
        ${scrolled ? "bg-white/80 shadow-sm" : "bg-white/40"}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-forest flex items-center gap-2">
          <Image
            src="/images/samass-logo.jpeg"
            alt="SAMASS"
            width={48}
            height={48}
            className="rounded-full object-cover shadow-md"
          />
          <span className="hidden sm:inline">SAMASS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-ink">
          <Link href="/" className="hover:text-forest transition-colors">Accueil</Link>
          <Link href="/services" className="hover:text-forest transition-colors">Services</Link>
          <Link href="/about" className="hover:text-forest transition-colors">À Propos</Link>
          <Link href="/contact" className="hover:text-forest transition-colors">Contact</Link>
        </nav>

        <button
          className="md:hidden text-forest font-semibold"
          onClick={() => setOpen(!open)}
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white/95 border-t border-emerald-50 shadow-lg">
          <div className="px-6 py-4 flex flex-col gap-3 text-ink">
            {[
              { href: "/", label: "Accueil" },
              { href: "/services", label: "Services" },
              { href: "/about", label: "À Propos" },
              { href: "/contact", label: "Contact" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-forest transition"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
