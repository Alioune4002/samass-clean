import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "samass_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAdminPassword() {
  const value = process.env.ADMIN_PASSWORD || "";
  if (!value) {
    throw new Error("Mot de passe admin non configuré.");
  }
  return value;
}

function getSessionSecret() {
  const value = process.env.SAMASS_ADMIN_SECRET_V2 || "";
  if (!value) {
    throw new Error("Secret de session admin non configuré.");
  }
  return value;
}

function sessionToken() {
  return crypto
    .createHash("sha256")
    .update(`samass-admin-session:${getSessionSecret()}:${getAdminPassword()}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function validateAdminPassword(password: string) {
  return safeEqual(password, getAdminPassword());
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value || "";
  return Boolean(value) && safeEqual(value, sessionToken());
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
