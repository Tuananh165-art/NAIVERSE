import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  from: vi.fn(),
  query: {} as Record<string, ReturnType<typeof vi.fn>>,
  currentData: null as null | { id: string; plan_data: Record<string, unknown> },
  updateData: null as null | Record<string, unknown>,
}));

vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser: mocks.getCurrentUser,
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { PATCH } from "@/app/api/trips/[tripId]/route";

const tripId = "cc1f61f8-2b3b-4e63-8a9c-fbfda58de391";
const savedPlan = {
  selectedOption: "easy",
  options: [
    { id: "easy", stops: [{ id: "place-a", name: "A" }, { id: "place-b", name: "B" }, { id: "place-c", name: "C" }], route: { distanceKm: 20, durationMinutes: 30 } },
    { id: "varied", stops: [{ id: "place-b", name: "B" }, { id: "place-c", name: "C" }], route: null },
  ],
};

function request(body: unknown) {
  return new Request(`http://localhost/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("saved trip updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentData = { id: tripId, plan_data: structuredClone(savedPlan) };
    mocks.updateData = null;
    mocks.query = {};
    mocks.query.select = vi.fn(() => mocks.query);
    mocks.query.eq = vi.fn(() => mocks.query);
    mocks.query.maybeSingle = vi.fn(async () => mocks.updateData
      ? { data: { id: tripId, updated_at: "2026-10-16T00:00:00.000Z" }, error: null }
      : { data: mocks.currentData, error: null });
    mocks.query.update = vi.fn((value: Record<string, unknown>) => {
      mocks.updateData = value;
      return mocks.query;
    });
    mocks.from.mockReturnValue(mocks.query);
    mocks.createSupabaseServerClient.mockResolvedValue({ from: mocks.from });
    mocks.getCurrentUser.mockResolvedValue({ id: "customer-1" });
  });

  it("requires authentication before reading or changing a trip", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);
    const response = await PATCH(request({ stopOrder: ["place-b", "place-a", "place-c"] }), { params: Promise.resolve({ tripId }) });
    expect(response.status).toBe(401);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("reorders only saved place IDs and clears the stale route metric", async () => {
    const response = await PATCH(request({ stopOrder: ["place-c", "place-a", "place-b"] }), { params: Promise.resolve({ tripId }) });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.trip.id).toBe(tripId);
    expect(mocks.from).toHaveBeenCalledWith("trips");
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "customer-1");

    const updatedPlan = (mocks.updateData?.plan_data as typeof savedPlan);
    expect(updatedPlan.options[0].stops.map((stop) => stop.id)).toEqual(["place-c", "place-a", "place-b"]);
    expect(updatedPlan.options[0].route).toBeNull();
    expect(updatedPlan.options[0]).toMatchObject({ orderManuallyChanged: true });
    expect(updatedPlan.options[1]).toEqual(savedPlan.options[1]);
  });

  it("rejects duplicate stop IDs before writing", async () => {
    const response = await PATCH(request({ stopOrder: ["place-a", "place-a", "place-c"] }), { params: Promise.resolve({ tripId }) });
    expect(response.status).toBe(400);
    expect(mocks.query.update).not.toHaveBeenCalled();
  });

  it("rejects a stop that is not part of the selected saved option", async () => {
    const response = await PATCH(request({ stopOrder: ["place-a", "private-place", "place-c"] }), { params: Promise.resolve({ tripId }) });
    expect(response.status).toBe(400);
    expect(mocks.query.update).not.toHaveBeenCalled();
  });

  it("keeps title-only updates supported", async () => {
    const response = await PATCH(request({ title: "Weekend in Đồng Nai" }), { params: Promise.resolve({ tripId }) });
    expect(response.status).toBe(200);
    expect(mocks.query.update).toHaveBeenCalledWith({ title: "Weekend in Đồng Nai" });
  });
});
