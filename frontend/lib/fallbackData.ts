import { Availability, Service } from "./types";
import { buildFallbackServices } from "./serviceCatalog";

export const FALLBACK_STORAGE_KEYS = {
  services: "samass_fallback_services",
  availabilities: "samass_fallback_availabilities",
  reservationDraft: "samass_reservation_draft",
} as const;

export const FALLBACK_SERVICES: Service[] = buildFallbackServices();

export const FALLBACK_AVAILABILITIES: Availability[] = [];

export function cloneFallbackServices(): Service[] {
  return FALLBACK_SERVICES.map((service) => ({
    ...service,
    long_description: service.long_description ?? null,
    durations_prices: { ...service.durations_prices },
  }));
}

export function cloneFallbackAvailabilities(): Availability[] {
  return FALLBACK_AVAILABILITIES.map((availability) => ({ ...availability }));
}
