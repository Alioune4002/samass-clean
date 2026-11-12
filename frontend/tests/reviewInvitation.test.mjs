import test from "node:test";
import assert from "node:assert/strict";
import { hasSessionEndedInParis } from "../lib/bookingSlots.ts";

test("a confirmed 60-minute session is eligible only when it has ended", () => {
  const slot = "2026-11-12T14:00:00";
  assert.equal(hasSessionEndedInParis(slot, 60, new Date("2026-11-12T13:59:00Z")), false); // 14:59 Paris
  assert.equal(hasSessionEndedInParis(slot, 60, new Date("2026-11-12T14:00:00Z")), true);  // 15:00 Paris
});

test("75-minute session cannot be invited too early", () => {
  const slot = "2026-11-12T10:00:00";
  assert.equal(hasSessionEndedInParis(slot, 75, new Date("2026-11-12T10:00:00Z")), false); // 11:00 Paris
  assert.equal(hasSessionEndedInParis(slot, 75, new Date("2026-11-12T10:15:00Z")), true); // 11:15 Paris
});

test("summer time is respected in Europe/Paris", () => {
  const slot = "2026-07-14T18:00:00";
  assert.equal(hasSessionEndedInParis(slot, 60, new Date("2026-07-14T16:59:00Z")), false); // 18:59 Paris
  assert.equal(hasSessionEndedInParis(slot, 60, new Date("2026-07-14T17:00:00Z")), true);  // 19:00 Paris
});

test("invalid slot and invalid duration are rejected", () => {
  const now = new Date("2026-11-12T15:00:00Z");
  assert.equal(hasSessionEndedInParis("2026-11-32T10:00:00", 60, now), false);
  assert.equal(hasSessionEndedInParis("2026-11-12T10:00:00", 0, now), false);
  assert.equal(hasSessionEndedInParis("2026-11-12T10:00:00", 999, now), false);
});
