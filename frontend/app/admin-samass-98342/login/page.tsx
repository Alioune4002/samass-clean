"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminPassword, startAdminSession } from "@/lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: any) => {
    e.preventDefault();
    const configuredPassword = getAdminPassword();

    if (!configuredPassword) {
      setError(
        "Le mot de passe admin local n'est pas configuré. Ajoutez NEXT_PUBLIC_ADMIN_PASSWORD."
      );
      return;
    }

    if (password !== configuredPassword) {
      setError("Mot de passe incorrect.");
      return;
    }

    startAdminSession();
    router.push("/admin-samass-98342/services");
  };

  return (
    <div className="max-w-sm mx-auto pt-20">
      <h1 className="text-2xl font-bold mb-4">Connexion Admin</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type={showPwd ? "text" : "password"}
          placeholder="Mot de passe admin"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="text-sm text-gray-500 self-end"
          onClick={() => setShowPwd(!showPwd)}
        >
          {showPwd ? "Masquer" : "Afficher"}
        </button>

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="bg-black text-white p-2 rounded hover:bg-gray-800"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
