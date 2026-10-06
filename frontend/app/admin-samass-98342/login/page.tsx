"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(password);
      router.push("/admin-samass-98342/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1915] px-5 py-20 text-white">
      <div className="mx-auto max-w-sm rounded-[28px] border border-white/10 bg-white/[0.06] p-7 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
          Espace Sam
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Connexion</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Accès privé aux demandes, messages et réservations SAMASS.
        </p>

        <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Mot de passe"
            autoComplete="current-password"
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-emerald-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="self-end text-xs text-white/55 hover:text-white"
            onClick={() => setShowPwd((value) => !value)}
          >
            {showPwd ? "Masquer" : "Afficher"}
          </button>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
