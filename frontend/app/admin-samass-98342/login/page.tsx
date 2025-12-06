"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "badou2004"; // mot de passe admin

  const handleLogin = (e: any) => {
    e.preventDefault();

    if (password !== ADMIN_PASSWORD) {
      setError("Identifiants incorrects.");
      return;
    }

    // Flag de connexion
    localStorage.setItem("samass_admin_logged", "true");

    // Redirection
    router.push("/admin-samass-98342/services");
  };

  return (
    <div className="max-w-sm mx-auto pt-20">
      <h1 className="text-2xl font-bold mb-4">Connexion Admin</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="password"
          placeholder="Mot de passe admin"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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
