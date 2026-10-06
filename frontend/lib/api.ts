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
import { buildFallbackServices, enrichServicesForDisplay } from "./serviceCatalog";
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
        "L'envoi de mail est momentanement indisponible. Merci de contacter Sam directement."
    );
  }

  return {
    message:
      data.message ||
      "Votre demande a bien ete envoyee. Sam vous recontactera rapidement.",
    mode: "fallback" as const,
  };
}

export async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch("/api/services", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Catalogue indisponible.");
    const services = (await response.json()) as Service[];
    return enrichServicesForDisplay(services);
  } catch {
    return enrichServicesForDisplay(buildFallbackServices());
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
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_comment: data.client_comment,
      service_id: data.serviceId,
      service_title: data.serviceTitle,
      duration_minutes: data.durationMinutes,
      requested_datetime: data.startDateTime,
      requested_label: data.slotLabel,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Impossible d'envoyer la demande.");
  }

  return {
    mode: "fallback",
    message:
      result.message ||
      "Votre demande a bien été transmise à Sam. Elle reste à confirmer.",
  };
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ContactRequestResult> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Impossible d'envoyer le message.");
  }

  return {
    mode: "fallback",
    message: "Votre message a bien été reçu. Sam vous répondra rapidement.",
  };
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
