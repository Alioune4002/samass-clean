const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://samass-massage.onrender.com";


const ADMIN_TOKEN = "06c7565187458582376c70e3c07c8cb91e378fd1";


async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
    Authorization: `Token ${ADMIN_TOKEN}`,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("API ERROR:", res.status, errBody);
    throw new Error(`Erreur API (${res.status}) : ${errBody}`);
  }

  return res.json();
}

/* --- SERVICES --- */
export const adminGetServices = () => apiRequest(`/services/`);

export const adminCreateService = (data: any) =>
  apiRequest(`/services/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminDeleteService = (id: number) =>
  apiRequest(`/services/${id}/`, {
    method: "DELETE",
  });

export const adminUpdateService = (id: number, data: any) =>
  apiRequest(`/services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

/* --- AVAILABILITIES --- */
export const adminGetAvailabilities = (service?: number, date?: string) => {
  const params = new URLSearchParams();
  if (service) params.set("service", String(service));
  if (date) params.set("date", date);
  return apiRequest(`/availabilities/?${params.toString()}`);
};

export const adminCreateAvailability = (data: any) =>
  apiRequest(`/availabilities/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminDeleteAvailability = (id: number) =>
  apiRequest(`/availabilities/${id}/`, { method: "DELETE" });

/* --- BOOKINGS --- */
export const adminGetBookings = () => apiRequest(`/bookings/`);
export const adminGetBooking = (id: number) =>
  apiRequest(`/bookings/${id}/`);

export const adminConfirmBooking = (id: number) =>
  apiRequest(`/bookings/${id}/confirm/`, { method: "POST" });

export const adminCancelBooking = (id: number) =>
  apiRequest(`/bookings/${id}/cancel/`, { method: "POST" });

/* --- CONTACT / MESSAGES --- */
export const adminGetMessages = () => apiRequest(`/contact/`);
