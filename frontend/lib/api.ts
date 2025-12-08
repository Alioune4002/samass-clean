import { Availability, Booking, Service } from "./types";

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ||
    "https://samass-massage.onrender.com/api").replace(/\/$/, "");

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: options.cache ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Erreur API ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getServices(): Promise<Service[]> {
  return apiFetch<Service[]>("/services/");
}

export async function createAvailability(data: {
  serviceId: number;
  start_datetime: string;
  end_datetime: string;
}) {
  return apiFetch<Availability>("/availabilities/", {
    method: "POST",
    body: JSON.stringify({
      service_id: data.serviceId,
      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,
    }),
  });
}

export async function getAvailabilities(date?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);

  return apiFetch<Availability[]>(
    `/availabilities/${params.toString() ? `?${params.toString()}` : ""}`
  );
}

export async function createBooking(data: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  availabilityId: number;
  serviceId: number;
  durationMinutes: number;
}): Promise<Booking> {
  return apiFetch<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify({
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      service_id: data.serviceId,
      availability_id: data.availabilityId,
      duration_minutes: data.durationMinutes,
    }),
  });
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return apiFetch<{ message: string }>("/contact/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAvailability(id: number) {
  return apiFetch<{ message: string }>(`/availabilities/${id}/`, {
    method: "DELETE",
  });
}
