import test from "node:test";
import assert from "node:assert/strict";
import {
  earliestPreparationTime, listProposableTimes, nextProposableSlot,
  parisToday, validateProposedSlot,
} from "../lib/bookingSlots.ts";

const winter = (hour, minute = 0) => new Date(Date.UTC(2026, 10, 10, hour - 1, minute));

test("17 h 52 : premier horaire demain 10 h", () => {
  const now = winter(17, 52);
  assert.equal(earliestPreparationTime(now), "2026-11-10T21:00");
  assert.deepEqual(listProposableTimes("2026-11-10", 60, now), []);
  assert.deepEqual(nextProposableSlot(60, now), { date: "2026-11-11", time: "10:00" });
  assert.deepEqual(listProposableTimes("2026-11-11", 60, now).slice(0, 4),
    ["10:00", "10:30", "11:00", "11:30"]);
  assert.equal(validateProposedSlot("2026-11-10T18:30:00", 60, now).valid, false);
  assert.equal(validateProposedSlot("2026-11-11T10:00:00", 60, now).valid, true);
});

test("Dernier départ à 19 h seulement si durée de 60 minutes", () => {
  const now = winter(15, 1);
  assert.equal(earliestPreparationTime(now), "2026-11-10T19:00");
  assert.deepEqual(listProposableTimes("2026-11-10", 60, now), ["19:00"]);
  assert.equal(validateProposedSlot("2026-11-10T19:00:00", 60, now).valid, true);
  assert.equal(validateProposedSlot("2026-11-10T19:30:00", 30, now).valid, false);
  assert.deepEqual(listProposableTimes("2026-11-10", 75, now), []);
  assert.deepEqual(nextProposableSlot(75, now), { date: "2026-11-11", time: "10:00" });
});

test("Arrondi d'un délai strict de trois heures", () => {
  const now = winter(10, 15);
  assert.equal(earliestPreparationTime(now), "2026-11-10T14:00");
  assert.equal(validateProposedSlot("2026-11-10T13:30:00", 60, now).valid, false);
  assert.equal(validateProposedSlot("2026-11-10T14:00:00", 60, now).valid, true);
  assert.equal(earliestPreparationTime(winter(10, 0)), "2026-11-10T13:00");
});

test("75 minutes : dernier début à 18 h 30 et fin au plus tard 20 h", () => {
  const now = winter(7, 0);
  const times = listProposableTimes("2026-11-10", 75, now);
  assert.equal(times[0], "10:00");
  assert.equal(times.at(-1), "18:30");
  assert.equal(validateProposedSlot("2026-11-10T19:00:00", 75, now).valid, false);
  assert.equal(validateProposedSlot("2026-11-10T18:30:00", 75, now).valid, true);
});

test("Rejette dates, horaires et durées invalides", () => {
  const now = winter(7);
  for (const proposal of [
    "2026-11-09T14:00:00", "2026-11-10T09:30:00",
    "2026-11-10T18:17:00", "2026-11-10T20:00:00",
    "2026-02-31T10:00:00", "2026-11-10T14:00:59",
  ]) {
    assert.equal(validateProposedSlot(proposal, 60, now).valid, false, proposal);
  }
  assert.equal(validateProposedSlot("2026-11-10T10:00:00", 0, now).valid, false);
  assert.equal(validateProposedSlot("2026-11-10T10:00:00", 1000, now).valid, false);
});

test("Changements d'heure printemps et automne à Paris", () => {
  const summer = new Date("2026-03-29T06:05:00Z"); // 08:05 heure de Paris
  assert.equal(parisToday(summer), "2026-03-29");
  assert.equal(earliestPreparationTime(summer), "2026-03-29T12:00");
  assert.equal(nextProposableSlot(60, summer)?.time, "12:00");
  const autumn = new Date("2026-10-25T16:52:00Z"); // 17:52 heure de Paris
  assert.equal(earliestPreparationTime(autumn), "2026-10-25T21:00");
  assert.deepEqual(nextProposableSlot(60, autumn), { date: "2026-10-26", time: "10:00" });
});
