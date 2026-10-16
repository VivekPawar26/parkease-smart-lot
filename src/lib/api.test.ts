import { afterEach, describe, expect, it } from "bun:test";
import { getStatus } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("getStatus", () => {
  it("maps the backend vehicle keys and calculates aggregate totals", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          BUS: { available: 2, occupied: 0 },
          CAR: { available: 5, occupied: 0 },
          BIKE: { available: 5, occupied: 0 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    await expect(getStatus()).resolves.toEqual({
      totalSlots: 12,
      availableSlots: 12,
      occupiedSlots: 0,
      totalRevenue: 0,
      bike: { total: 5, available: 5, occupied: 0 },
      car: { total: 5, available: 5, occupied: 0 },
      bus: { total: 2, available: 2, occupied: 0 },
    });
  });

  it("uses zero counts for missing vehicle keys and counts", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ CAR: { occupied: 1 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    await expect(getStatus()).resolves.toEqual({
      totalSlots: 1,
      availableSlots: 0,
      occupiedSlots: 1,
      totalRevenue: 0,
      bike: { total: 0, available: 0, occupied: 0 },
      car: { total: 1, available: 0, occupied: 1 },
      bus: { total: 0, available: 0, occupied: 0 },
    });
  });
});