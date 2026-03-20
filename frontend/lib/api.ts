import {
  BackendUnavailableError,
  ManualReservationRequiredError,
  isBackendUnavailableError,
  requestJson,
} from "./backendFallback";
import {
  createLocalAvailability,
  deleteLocalAvailability,
  getLocalAvailabilities,
  getLocalServices,
  saveLocalAvailabilities,
  saveLocalServices,
} from "./fallbackStore";
import { Availability, Booking, Service } from "./types";

export async function getServices(): Promise<Service[]> {
  try {
    const services = await requestJson<Service[]>("/services/");
    saveLocalServices(services);
    return services;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return getLocalServices();
    }
    throw error;
  }
}

export async function createAvailability(data: {
  serviceId: number;
  start_datetime: string;
  end_datetime: string;
}) {
  try {
    const availability = await requestJson<Availability>("/availabilities/", {
      method: "POST",
      body: JSON.stringify({
        service_id: data.serviceId,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
      }),
    });
    saveLocalAvailabilities([
      ...getLocalAvailabilities().filter((item) => item.id !== availability.id),
      availability,
    ]);
    return availability;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return createLocalAvailability({
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
      });
    }
    throw error;
  }
}

export async function getAvailabilities(_date?: string) {
  try {
    const availabilities = await requestJson<Availability[]>(`/availabilities/`);
    saveLocalAvailabilities(availabilities);
    return availabilities;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return getLocalAvailabilities();
    }
    throw error;
  }
}

export async function createBooking(data: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_comment?: string;
  availabilityId: number;
  serviceId: number;
  durationMinutes: number;
  startDateTime: string;
}): Promise<Booking> {
  try {
    return await requestJson<Booking>("/bookings/", {
      method: "POST",
      body: JSON.stringify({
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_comment: data.client_comment,
        service_id: data.serviceId,
        availability_id: data.availabilityId,
        duration_minutes: data.durationMinutes,
        start_datetime: data.startDateTime,
      }),
    });
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      throw new ManualReservationRequiredError();
    }
    throw error;
  }
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  try {
    return await requestJson<{ message: string }>("/contact/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      throw new Error(
        "Le formulaire est momentanement indisponible. Merci de contacter SAMASS par telephone, WhatsApp ou Facebook."
      );
    }
    throw error;
  }
}

export async function deleteAvailability(id: number) {
  try {
    return await requestJson<{ message: string }>(`/availabilities/${id}/`, {
      method: "DELETE",
    });
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      deleteLocalAvailability(id);
      return { message: "Disponibilite supprimee localement." };
    }
    throw error;
  }
}
