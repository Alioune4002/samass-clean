import {
  ApiError,
  BackendUnavailableError,
  isBackendUnavailableError,
  requestJson,
} from "./backendFallback";
import {
  createLocalAvailability,
  createLocalService,
  deleteLocalAvailability,
  deleteLocalService,
  getLocalAvailabilities,
  getLocalServices,
  saveLocalAvailabilities,
  saveLocalServices,
  updateLocalAvailability,
  updateLocalService,
} from "./fallbackStore";
import { enrichServicesForDisplay } from "./serviceCatalog";
import { Availability, Booking, Service } from "./types";

async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(((options.headers as Record<string, string>) || {}) as Record<
      string,
      string
    >),
  };

  try {
    return await requestJson<T>(endpoint, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("API ERROR:", error.status, error.body);
      throw new Error(`Erreur API (${error.status}) : ${error.body}`);
    }
    if (error instanceof BackendUnavailableError) {
      throw error;
    }
    throw error;
  }
}

/* --- SERVICES --- */
async function saveAdminServices(services: Service[]) {
  return adminInternalRequest<Service[]>("/api/admin/services", {
    method: "PUT",
    body: JSON.stringify({ services }),
  });
}

export async function adminGetServices() {
  return adminInternalRequest<Service[]>("/api/admin/services");
}

export async function adminCreateService(data: {
  title: string;
  description: string;
  durations_prices: Record<string, number>;
}) {
  const services = await adminGetServices();
  const nextId =
    services.reduce((max, service) => Math.max(max, service.id || 0), 0) + 1;
  const created: Service = {
    id: nextId,
    title: data.title,
    description: data.description,
    long_description: null,
    durations_prices: { ...data.durations_prices },
    image: null,
    is_active: true,
  };
  await saveAdminServices([...services, created]);
  return created;
}

export async function adminDeleteService(id: number) {
  const services = await adminGetServices();
  await saveAdminServices(services.filter((service) => service.id !== id));
  return { message: "Service supprimé." };
}

export async function adminUpdateService(id: number, data: Partial<Service>) {
  const services = await adminGetServices();
  const next = services.map((service) =>
    service.id === id
      ? {
          ...service,
          ...data,
          durations_prices: data.durations_prices
            ? { ...data.durations_prices }
            : { ...service.durations_prices },
        }
      : service
  );
  await saveAdminServices(next);
  const updated = next.find((service) => service.id === id);
  if (!updated) throw new Error("Service introuvable.");
  return updated;
}

/* --- AVAILABILITIES --- */
export async function adminGetAvailabilities(date?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  const query = params.toString();
  try {
    const availabilities = await apiRequest<Availability[]>(
      `/availabilities/${query ? `?${query}` : ""}`
    );
    saveLocalAvailabilities(availabilities);
    return availabilities;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      const availabilities = getLocalAvailabilities();
      if (!date) return availabilities;
      return availabilities.filter((item) => item.start_datetime.startsWith(date));
    }
    throw error;
  }
}

export async function adminCreateAvailability(data: {
  start_datetime: string;
  end_datetime: string;
  service_id?: number | null;
}) {
  try {
    const availability = await apiRequest<Availability>(`/availabilities/`, {
      method: "POST",
      body: JSON.stringify({
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        service_id: data.service_id ?? null,
      }),
    });
    saveLocalAvailabilities([
      ...getLocalAvailabilities().filter((item) => item.id !== availability.id),
      availability,
    ]);
    return availability;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return createLocalAvailability(data);
    }
    throw error;
  }
}

export async function adminUpdateAvailability(
  id: number,
  data: {
    start_datetime: string;
    end_datetime: string;
    service_id?: number | null;
  }
){
  try {
    const availability = await apiRequest<Availability>(`/availabilities/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    saveLocalAvailabilities(
      getLocalAvailabilities().map((item) =>
        item.id === id ? availability : item
      )
    );
    return availability;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      const availability = updateLocalAvailability(id, data);
      if (!availability) {
        throw new Error("Disponibilite introuvable en mode local.");
      }
      return availability;
    }
    throw error;
  }
}

export async function adminDeleteAvailability(id: number) {
  try {
    return await apiRequest(`/availabilities/${id}/`, { method: "DELETE" });
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      deleteLocalAvailability(id);
      return { message: "Disponibilite supprimee localement." };
    }
    throw error;
  }
}

/* --- BOOKINGS --- */
type StoredBookingResponse = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_comment?: string;
  service_id?: number;
  service_title: string;
  duration_minutes: number;
  requested_datetime: string;
  requested_label?: string;
  status: "pending" | "confirmed" | "canceled";
  created_at: string;
  updated_at: string;
};

function mapStoredBooking(item: StoredBookingResponse): Booking {
  return {
    id: item.id,
    client_name: item.client_name,
    client_email: item.client_email,
    client_phone: item.client_phone || "",
    client_comment: item.client_comment,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    service: {
      id: item.service_id || 0,
      title: item.service_title,
      description: "",
      durations_prices: { [String(item.duration_minutes)]: 0 },
    },
    availability: {
      id: 0,
      start_datetime: item.requested_datetime,
      end_datetime: item.requested_datetime,
      is_booked: item.status === "confirmed",
      service_id: item.service_id || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    },
  };
}

async function adminInternalRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Erreur espace Sam.");
  }
  return data as T;
}

export async function adminGetBookings() {
  const items = await adminInternalRequest<StoredBookingResponse[]>(
    "/api/admin/bookings"
  );
  return items.map(mapStoredBooking);
}

export async function adminGetBooking(id: string | number) {
  const item = await adminInternalRequest<StoredBookingResponse>(
    `/api/admin/bookings/${id}`
  );
  return mapStoredBooking(item);
}

export async function adminConfirmBooking(id: string | number) {
  return adminInternalRequest(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "confirmed" }),
  });
}

export async function adminCancelBooking(id: string | number) {
  return adminInternalRequest(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "canceled" }),
  });
}

/* --- CONTACT / MESSAGES --- */
export type ContactMessage = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
};

export const adminGetMessages = () =>
  adminInternalRequest<ContactMessage[]>("/api/admin/messages");

export const adminDeleteMessage = (id: string | number) =>
  adminInternalRequest(`/api/admin/messages/${id}`, { method: "DELETE" });

export const adminMarkMessageRead = (id: string | number) =>
  adminInternalRequest<ContactMessage>(`/api/admin/messages/${id}`, {
    method: "PATCH",
  });
