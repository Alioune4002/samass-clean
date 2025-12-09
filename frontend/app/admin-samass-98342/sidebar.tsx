"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin-samass-98342/dashboard", label: "Dashboard" },
  { href: "/admin-samass-98342/bookings", label: "Réservations" },
  { href: "/admin-samass-98342/availability", label: "Disponibilités" },
  { href: "/admin-samass-98342/services", label: "Services" },
  { href: "/admin-samass-98342/messages", label: "Messages" },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-[#0D0D0D] border-b border-gray-800 px-4 py-3">
        <div className="text-lg font-semibold text-emerald-400">SAMASS Admin</div>
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-2 bg-emerald-600 rounded-lg text-white"
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`md:static fixed top-0 left-0 h-full w-full md:w-64 max-w-full md:max-w-[80%] bg-[#111111] border-r border-gray-800 p-6 flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } z-30`}
      >
        <h2 className="text-2xl font-bold text-emerald-400 mb-10 uppercase tracking-wider hidden md:block">
          SAMASS Admin
        </h2>

        <nav className="space-y-2">
          {links.map((link) => {
            const active = path?.startsWith(link.href) ?? false;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 rounded-lg transition font-medium ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
