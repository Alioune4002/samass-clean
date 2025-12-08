"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import "../globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const logged = localStorage.getItem("samass_admin_logged");
    const hasCookie =
      typeof document !== "undefined" &&
      document.cookie.includes("admin_token=");

    if (logged !== "true" && !hasCookie) {
      router.push("/admin-samass-98342/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
