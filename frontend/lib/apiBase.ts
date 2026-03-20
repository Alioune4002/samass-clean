const rawBase =
  process.env.NEXT_PUBLIC_API_URL || "https://samass-massage.onrender.com/api";
const normalized = rawBase.replace(/\/$/, "");

export const API_BASE = normalized.endsWith("/api")
  ? normalized
  : `${normalized}/api`;
