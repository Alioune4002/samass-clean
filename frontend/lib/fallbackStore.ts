"use client";

import {
  FALLBACK_STORAGE_KEYS,
  cloneFallbackAvailabilities,
  cloneFallbackServices,
} from "./fallbackData";
import { Availability, Service } from "./types";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore les erreurs de quota/localStorage indisponible.
  }
}

function nextLocalId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function normalizeAvailabilities(items: Availability[]) {
  const now = Date.now();

  return items
    .filter((item) => new Date(item.end_datetime).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
}

export function getLocalServices() {
  const stored = readStorage<Service[]>(
    FALLBACK_STORAGE_KEYS.services,
    cloneFallbackServices()
  );

  return stored.map((service) => ({
    ...service,
    durations_prices: { ...service.durations_prices },
  }));
}

export function saveLocalServices(services: Service[]) {
  writeStorage(
    FALLBACK_STORAGE_KEYS.services,
    services.map((service) => ({
      ...service,
      durations_prices: { ...service.durations_prices },
    }))
  );
}

export function createLocalService(data: {
  title: string;
  description: string;
  durations_prices: Record<string, number>;
}) {
  const services = getLocalServices();
  const service: Service = {
    id: nextLocalId(services),
    title: data.title,
    description: data.description,
    durations_prices: { ...data.durations_prices },
    image: null,
    is_active: true,
  };

  const next = [...services, service];
  saveLocalServices(next);
  return service;
}

export function updateLocalService(id: number, data: Partial<Service>) {
  const services = getLocalServices();
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

  saveLocalServices(next);
  return next.find((service) => service.id === id) ?? null;
}

export function deleteLocalService(id: number) {
  const next = getLocalServices().filter((service) => service.id !== id);
  saveLocalServices(next);
}

export function getLocalAvailabilities() {
  const stored = readStorage<Availability[]>(
    FALLBACK_STORAGE_KEYS.availabilities,
    cloneFallbackAvailabilities()
  );
  const normalized = normalizeAvailabilities(stored);
  writeStorage(FALLBACK_STORAGE_KEYS.availabilities, normalized);
  return normalized;
}

export function saveLocalAvailabilities(availabilities: Availability[]) {
  writeStorage(
    FALLBACK_STORAGE_KEYS.availabilities,
    normalizeAvailabilities(availabilities)
  );
}

export function createLocalAvailability(data: {
  start_datetime: string;
  end_datetime: string;
}) {
  const availabilities = getLocalAvailabilities();
  const now = new Date().toISOString();
  const availability: Availability = {
    id: nextLocalId(availabilities),
    start_datetime: data.start_datetime,
    end_datetime: data.end_datetime,
    is_booked: false,
    created_at: now,
    updated_at: now,
  };

  const next = [...availabilities, availability];
  saveLocalAvailabilities(next);
  return availability;
}

export function updateLocalAvailability(
  id: number,
  data: Partial<Pick<Availability, "start_datetime" | "end_datetime" | "is_booked">>
) {
  const availabilities = getLocalAvailabilities();
  const now = new Date().toISOString();
  const next = availabilities.map((availability) =>
    availability.id === id
      ? {
          ...availability,
          ...data,
          updated_at: now,
        }
      : availability
  );

  saveLocalAvailabilities(next);
  return next.find((availability) => availability.id === id) ?? null;
}

export function deleteLocalAvailability(id: number) {
  const next = getLocalAvailabilities().filter(
    (availability) => availability.id !== id
  );
  saveLocalAvailabilities(next);
}
