import { API_BASE } from "./apiBase";

const REQUEST_TIMEOUT_MS = 5000;
const BACKEND_STATUS_EVENT = "samass-backend-status";

let backendFallbackActive = false;

function emitBackendStatus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BACKEND_STATUS_EVENT, {
      detail: { fallback: backendFallbackActive },
    })
  );
}

function setBackendFallbackActive(nextValue: boolean) {
  if (backendFallbackActive === nextValue) return;
  backendFallbackActive = nextValue;
  emitBackendStatus();
}

export function isBackendFallbackMode() {
  return backendFallbackActive;
}

export function getBackendStatusEventName() {
  return BACKEND_STATUS_EVENT;
}

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `Erreur API (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class BackendUnavailableError extends Error {
  constructor(message = "Le serveur SAMASS est momentanement indisponible.") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export class ManualReservationRequiredError extends Error {
  constructor() {
    super(
      "La reservation en ligne est momentanement indisponible. Merci de contacter Sam via la page Contact, par email ou par telephone."
    );
    this.name = "ManualReservationRequiredError";
  }
}

export function isBackendUnavailableError(error: unknown) {
  return error instanceof BackendUnavailableError;
}

function mergeHeaders(options: RequestInit) {
  return {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  return text.trim();
}

export async function requestJson<T>(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: options.cache ?? "no-store",
      headers: mergeHeaders(options),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await readResponseBody(response);

      if (response.status >= 500) {
        setBackendFallbackActive(true);
        throw new BackendUnavailableError(
          body || "Le backend SAMASS est momentanement indisponible."
        );
      }

      setBackendFallbackActive(false);
      throw new ApiError(response.status, body);
    }

    setBackendFallbackActive(false);

    if (response.status === 204) return {} as T;

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError || error instanceof BackendUnavailableError) {
      throw error;
    }

    if (
      error instanceof DOMException ||
      error instanceof TypeError ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      setBackendFallbackActive(true);
      throw new BackendUnavailableError();
    }

    throw error;
  }
}
