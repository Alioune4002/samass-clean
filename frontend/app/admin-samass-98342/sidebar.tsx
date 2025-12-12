"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGetMessages, adminGetBookings } from "@/lib/adminApi";

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
  const [badges, setBadges] = useState<{ bookings: number; messages: number }>({
    bookings: 0,
    messages: 0,
  });

  useEffect(() => {
    async function loadBadges() {
      try {
        const [bookings, messages] = await Promise.all([
          adminGetBookings(),
          adminGetMessages(),
        ]);
        setBadges({
          bookings: bookings.filter((b) => b.status === "pending").length,
          messages: messages.filter((m) => !m.is_read).length,
        });
      } catch (e) {
        console.error("Badges admin non chargés :", e);
      }
    }
    loadBadges();
  }, []);

  return (
    <>

      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 right-3 z-40 bg-emerald-600 text-white px-3 py-2 rounded-full shadow-lg"
      >
        Menu
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`md:static fixed top-0 left-0 h-full w-72 md:w-64 max-w-[80%] bg-[#111111] border-r border-gray-800 p-6 pt-16 md:pt-6 flex flex-col transform transition-transform duration-200 ${
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
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.label === "Réservations" && badges.bookings > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
                      {badges.bookings}
                    </span>
                  )}
                  {link.label === "Messages" && badges.messages > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
                      {badges.messages}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
