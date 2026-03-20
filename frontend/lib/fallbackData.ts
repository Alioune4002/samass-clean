import { Availability, Service } from "./types";

export const FALLBACK_STORAGE_KEYS = {
  services: "samass_fallback_services",
  availabilities: "samass_fallback_availabilities",
  reservationDraft: "samass_reservation_draft",
} as const;

export const FALLBACK_SERVICES: Service[] = [
  {
    id: 1,
    title: "Massage Relaxant Tonique",
    description:
      "Un massage complet melant douceur et gestes toniques, ideal pour relacher les tensions musculaires tout en retrouvant energie et legerete.",
    durations_prices: {
      "60": 80,
      "90": 120,
    },
    image: "/images/relax-massage.jpeg",
    is_active: true,
  },
  {
    id: 2,
    title: "Massage Tonique",
    description:
      "Un massage dynamique et revitalisant pour stimuler la circulation, delier les tensions profondes et redonner de l'elan au corps.",
    durations_prices: {
      "45": 50,
      "60": 70,
    },
    image: "/images/tonic-massage.jpeg",
    is_active: true,
  },
  {
    id: 3,
    title: "Massage Tantrique",
    description:
      "Une approche profonde et consciente pour reconnecter le corps, le souffle et les sensations dans une atmosphere calme et respectueuse.",
    durations_prices: {
      "60": 80,
      "90": 120,
    },
    image: "/images/tantric-massage.jpeg",
    is_active: true,
  },
];

export const FALLBACK_AVAILABILITIES: Availability[] = [];

export function cloneFallbackServices(): Service[] {
  return FALLBACK_SERVICES.map((service) => ({
    ...service,
    durations_prices: { ...service.durations_prices },
  }));
}

export function cloneFallbackAvailabilities(): Availability[] {
  return FALLBACK_AVAILABILITIES.map((availability) => ({ ...availability }));
}
