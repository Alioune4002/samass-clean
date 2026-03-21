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
    if (pathname === "/admin-samass-98342/login") {
      setAuthorized(true);
      setChecked(true);
      return;
    }

    const isAuthorized = isAdminSessionActive();
    if (!isAuthorized) {
      router.push("/admin-samass-98342/login");
      setAuthorized(false);
      setChecked(true);
      return;
    }
    setAuthorized(true);
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return null;
  }

  if (!authorized) {
    return null;
  }

  if (pathname === "/admin-samass-98342/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-5 md:p-6 overflow-auto pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
