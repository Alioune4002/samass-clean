"use client";

const ADMIN_SESSION_KEY = "samass_admin_logged";
const ADMIN_COOKIE_NAME = "admin_token";

export function getAdminPassword() {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
}

export function isAdminSessionActive() {
  if (typeof window === "undefined") return false;

  const logged = window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const hasCookie = document.cookie.includes(`${ADMIN_COOKIE_NAME}=ok`);
  return logged || hasCookie;
}

export function startAdminSession() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
  document.cookie = `${ADMIN_COOKIE_NAME}=ok; path=/; max-age=604800; samesite=lax`;
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
