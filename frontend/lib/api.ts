import {
  BackendUnavailableError,
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
import { enrichServicesForDisplay } from "./serviceCatalog";
import { Availability, Booking, Service } from "./types";

type BookingRequestResult =
  | { mode: "online"; booking: Booking }
  | { mode: "fallback"; message: string };

type ContactRequestResult = {
  mode: "online" | "fallback";
  message: string;
};

async function sendFallbackMail(payload: Record<string, unknown>) {
  const response = await fetch("/api/fallback-mail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    mode?: "fallback";
  };

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Le mode secours email est momentanement indisponible. Merci de contacter SAMASS directement."
    );
  }

  return {
    message:
      data.message ||
      "Votre demande a bien ete transmise en mode secours. Sam vous recontactera rapidement.",
    mode: "fallback" as const,
  };
}

export async function getServices(): Promise<Service[]> {
  try {
    const services = enrichServicesForDisplay(
      await requestJson<Service[]>("/services/")
    );
    saveLocalServices(services);
    return services;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return enrichServicesForDisplay(getLocalServices());
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
        service_id: data.serviceId,
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
  serviceTitle: string;
  durationMinutes: number;
  startDateTime: string;
  slotLabel?: string;
}): Promise<BookingRequestResult> {
  if (data.availabilityId < 0 || !data.startDateTime) {
    return sendFallbackMail({
      type: "booking",
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_comment: data.client_comment,
      service: data.serviceTitle,
      duration_minutes: data.durationMinutes,
      date_time: data.slotLabel || "A convenir avec Sam",
    });
  }

  try {
    const booking = await requestJson<Booking>("/bookings/", {
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
    return {
      mode: "online",
      booking,
    };
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return sendFallbackMail({
        type: "booking",
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        client_comment: data.client_comment,
        service: data.serviceTitle,
        duration_minutes: data.durationMinutes,
        date_time: data.slotLabel || "A convenir avec Sam",
      });
    }
    throw error;
  }
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ContactRequestResult> {
  try {
    const result = await requestJson<{ message: string }>("/contact/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      mode: "online",
      message:
        result.message || "Message envoyé avec succès. Je vous répondrai très vite.",
    };
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return sendFallbackMail({
        type: "contact",
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      });
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
