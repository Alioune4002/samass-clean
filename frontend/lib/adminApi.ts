import { API_BASE } from "./api";
import { Availability, Booking, Service } from "./types";

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>) || {},
  };

  if (ADMIN_TOKEN) {
    headers.Authorization = `Token ${ADMIN_TOKEN}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("API ERROR:", res.status, errBody);
    throw new Error(`Erreur API (${res.status}) : ${errBody}`);
  }

  // Certains endpoints (DELETE/204) renvoient un corps vide : on évite de parser JSON dans ce cas.
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/* --- SERVICES --- */
export const adminGetServices = () => apiRequest<Service[]>(`/services/`);

export const adminCreateService = (data: {
  title: string;
  description: string;
  durations_prices: Record<string, number>;
}) =>
  apiRequest<Service>(`/services/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminDeleteService = (id: number) =>
  apiRequest(`/services/${id}/`, {
    method: "DELETE",
  });

export const adminUpdateService = (id: number, data: Partial<Service>) =>
  apiRequest<Service>(`/services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

/* --- AVAILABILITIES --- */
export const adminGetAvailabilities = (date?: string) => {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  const query = params.toString();
  return apiRequest<Availability[]>(
    `/availabilities/${query ? `?${query}` : ""}`
  );
};

export const adminCreateAvailability = (data: {
  start_datetime: string;
  end_datetime: string;
}) =>
  apiRequest<Availability>(`/availabilities/`, {
    method: "POST",
    body: JSON.stringify({
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
    }),
  });

export const adminUpdateAvailability = (
  id: number,
  data: { start_datetime: string; end_datetime: string }
) =>
  apiRequest<Availability>(`/availabilities/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const adminDeleteAvailability = (id: number) =>
  apiRequest(`/availabilities/${id}/`, { method: "DELETE" });

/* --- BOOKINGS --- */
export const adminGetBookings = () => apiRequest<Booking[]>(`/bookings/`);
export const adminGetBooking = (id: number) =>
  apiRequest<Booking>(`/bookings/${id}/`);

export const adminConfirmBooking = (id: number) =>
  apiRequest(`/bookings/${id}/confirm/`, { method: "POST" });

export const adminCancelBooking = (id: number) =>
  apiRequest(`/bookings/${id}/cancel/`, { method: "POST" });

/* --- CONTACT / MESSAGES --- */
export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
};

export const adminGetMessages = () =>
  apiRequest<ContactMessage[]>(`/contact/`);

export const adminDeleteMessage = (id: number) =>
  apiRequest(`/contact/${id}/`, { method: "DELETE" });

export const adminMarkMessageRead = (id: number) =>
  apiRequest<ContactMessage>(`/contact/${id}/`, { method: "PATCH" });
