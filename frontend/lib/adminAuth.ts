"use client";

export async function isAdminSessionActive() {
  try {
    const response = await fetch("/api/admin/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function loginAdmin(password: string) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Connexion impossible.");
  }
  return true;
}

export async function clearAdminSession() {
  await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "same-origin",
  });
}
