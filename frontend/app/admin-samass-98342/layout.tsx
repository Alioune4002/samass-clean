"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import "../globals.css";
import { isAdminSessionActive } from "@/lib/adminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (pathname === "/admin-samass-98342/login") {
      setAuthorized(true);
      setChecked(true);
      return () => {
        cancelled = true;
      };
    }

    void isAdminSessionActive().then((isAuthorized) => {
      if (cancelled) return;

      if (!isAuthorized) {
        setAuthorized(false);
        setChecked(true);
        router.replace("/admin-samass-98342/login");
        return;
      }

      setAuthorized(true);
      setChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!checked || !authorized) {
    return null;
  }

  if (pathname === "/admin-samass-98342/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 pt-16 sm:p-5 md:p-6 md:pt-6">
        {children}
      </main>
    </div>
  );
}
