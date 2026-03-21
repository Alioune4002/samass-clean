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
export async function adminGetServices() {
  try {
    const services = await apiRequest<Service[]>(`/services/`);
    saveLocalServices(enrichServicesForDisplay(services));
    return services;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return getLocalServices();
    }
    throw error;
  }
}

export async function adminCreateService(data: {
  title: string;
  description: string;
  durations_prices: Record<string, number>;
}) {
  try {
    const service = await apiRequest<Service>(`/services/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    saveLocalServices([
      ...getLocalServices().filter((item) => item.id !== service.id),
      service,
    ]);
    return service;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return createLocalService(data);
    }
    throw error;
  }
}

export async function adminDeleteService(id: number) {
  try {
    return await apiRequest(`/services/${id}/`, {
      method: "DELETE",
    });
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      deleteLocalService(id);
      return { message: "Service supprime localement." };
    }
    throw error;
  }
}

export async function adminUpdateService(id: number, data: Partial<Service>) {
  try {
    const service = await apiRequest<Service>(`/services/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    saveLocalServices(
      getLocalServices().map((item) => (item.id === id ? service : item))
    );
    return service;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      const service = updateLocalService(id, data);
      if (!service) {
        throw new Error("Service introuvable en mode local.");
      }
      return service;
    }
    throw error;
  }
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
export async function adminGetBookings() {
  try {
    return await apiRequest<Booking[]>(`/bookings/`);
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return [];
    }
    throw error;
  }
}
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
  apiRequest<ContactMessage[]>(`/contact/`).catch((error) => {
    if (isBackendUnavailableError(error)) {
      return [];
    }
    throw error;
  });

export const adminDeleteMessage = (id: number) =>
  apiRequest(`/contact/${id}/`, { method: "DELETE" });

export const adminMarkMessageRead = (id: number) =>
  apiRequest<ContactMessage>(`/contact/${id}/`, { method: "PATCH" });
