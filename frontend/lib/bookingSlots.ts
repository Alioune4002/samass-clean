/**
 * Règles des horaires que les visiteurs peuvent PROPOSER à SAMASS.
 * Ce ne sont pas des disponibilités confirmées : Sam valide chaque demande.
 *
 * Toutes les comparaisons de dates se font dans le fuseau Europe/Paris,
 * quelle que soit l'heure locale de l'appareil du visiteur ou du serveur.
 */
export const SAMASS_TIME_ZONE = "Europe/Paris";
export const PREPARATION_HOURS = 3;
export const OPENING_HOUR = 10;
export const CLOSING_HOUR = 20;
export const LAST_START_HOUR = 19;
export const SLOT_STEP_MINUTES = 30;

export type ProposedSlot = { date: string; time: string };

function parisParts(instant: Date) {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: SAMASS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: string) => values.find((value) => value.type === type)?.value || "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    hour: Number(part("hour")),
  };
}

export function parisToday(now: Date = new Date()) {
  return parisParts(now).date;
}

export function parisHour(now: Date = new Date()) {
  return parisParts(now).hour;
}

/**
 * Compare une demande de réservation (heure locale à Quimper) avec la fin
 * de séance, sans dépendre du fuseau de l'ordinateur de l'administrateur.
 */
export function hasSessionEndedInParis(
  requestedDateTime: string,
  durationMinutes: number,
  now: Date = new Date()
): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/.exec(requestedDateTime);
  if (!match || !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 || durationMinutes > 240) return false;
  const start = new Date(`${match[1]}T${match[2]}:00.000Z`);
  if (!Number.isFinite(start.getTime()) ||
      start.toISOString().slice(0, 16) !== `${match[1]}T${match[2]}`) {
    return false;
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const localNow = parisParts(now);
  return end.toISOString().slice(0, 16) <= `${localNow.date}T${localNow.time}`;
}

function calendarDatePlusDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function parisTomorrow(now: Date = new Date()) {
  return calendarDatePlusDays(parisToday(now), 1);
}

/**
 * 17 h 52 + 3 h => premier début autorisable à 21 h pile.
 * L'arrondi est réalisé sur une heure réelle avant conversion en heure de Paris.
 */
export function earliestPreparationTime(now: Date = new Date()) {
  const first = Math.ceil(
    (now.getTime() + PREPARATION_HOURS * 60 * 60 * 1000) / (60 * 60 * 1000)
  ) * 60 * 60 * 1000;
  const local = parisParts(new Date(first));
  return `${local.date}T${local.time}`;
}

export function listProposableTimes(date: string, durationMinutes: number, now: Date = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const parsedDate = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return [];
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) {
    return [];
  }

  const min = earliestPreparationTime(now);
  const times: string[] = [];

  for (
    let start = OPENING_HOUR * 60;
    start <= LAST_START_HOUR * 60 && start + durationMinutes <= CLOSING_HOUR * 60;
    start += SLOT_STEP_MINUTES
  ) {
    const time = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(
      start % 60
    ).padStart(2, "0")}`;
    if (`${date}T${time}` >= min) times.push(time);
  }

  return times;
}

export function nextProposableSlot(durationMinutes: number, now: Date = new Date()): ProposedSlot | null {
  const today = parisToday(now);
  for (let day = 0; day < 31; day++) {
    const date = calendarDatePlusDays(today, day);
    const times = listProposableTimes(date, durationMinutes, now);
    if (times.length) return { date, time: times[0] };
  }
  return null;
}

export function validateProposedSlot(
  requestedDateTime: string,
  durationMinutes: number,
  now: Date = new Date()
): { valid: boolean; error?: string; nextProposable: ProposedSlot | null } {
  const nextProposable = nextProposableSlot(durationMinutes, now);
  const parsed = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::00)?$/.exec(requestedDateTime);

  if (!parsed || !Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240) {
    return { valid: false, error: "Choisissez une date, un horaire et une durée valides.", nextProposable };
  }

  const [, date, time] = parsed;
  const options = listProposableTimes(date, durationMinutes, now);
  if (!options.includes(time)) {
    return {
      valid: false,
      error:
        "Ce créneau ne peut plus être proposé. Prévoyez au moins 3 heures pour la préparation de votre séance, avec une fin de massage à 20 h au plus tard. Choisissez un autre horaire.",
      nextProposable,
    };
  }
  return { valid: true, nextProposable };
}

export function prettyHour(time: string) {
  const [hours, minutes] = time.split(":");
  return minutes === "00" ? `${Number(hours)} h` : `${Number(hours)} h ${minutes}`;
}

export function prettyDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}
