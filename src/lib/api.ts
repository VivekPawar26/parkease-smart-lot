export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ??
  "http://localhost:8080/api/parking";

export type VehicleType = "BIKE" | "CAR" | "BUS";

export type ParkResponse = {
  success: boolean;
  message?: string;
  slotId?: number;
  numberPlate?: string;
  type?: VehicleType;
};

export type ExitResponse = {
  success: boolean;
  message?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  slotId?: number;
  entryTime?: string;
  exitTime?: string;
  fee?: number;
};

export type Slot = {
  slotId: number;
  type: VehicleType;
  occupied: boolean;
  vehicleNumber: string | null;
};

export type TypeStatus = { total: number; available: number; occupied: number };

export type Status = {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  totalRevenue: number;
  bike: TypeStatus;
  car: TypeStatus;
  bus: TypeStatus;
};

export type Revenue = { totalRevenue: number };

export class ApiError extends Error {
  status: number;
  offline: boolean;
  constructor(message: string, status = 0, offline = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.offline = offline;
  }
}

export const OFFLINE_MESSAGE = `Backend unavailable — could not reach ${API_BASE_URL}. Make sure the Spring Boot API is running.`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0, true);
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  const looksLikeHtml = typeof body === "string" && /^\s*<(!doctype|html)/i.test(body);

  if (!response.ok) {
    if (looksLikeHtml) throw new ApiError(OFFLINE_MESSAGE, response.status, true);
    const raw =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : typeof body === "string" && body
          ? body
          : "";
    const message = (raw.trim().slice(0, 300) || `Request failed with status ${response.status}`);
    throw new ApiError(message, response.status);
  }

  if (looksLikeHtml) throw new ApiError(OFFLINE_MESSAGE, response.status, true);

  return body as T;

}

export function parkVehicle(input: { numberPlate: string; type: VehicleType }) {
  return request<ParkResponse>("/park", { method: "POST", body: JSON.stringify(input) });
}

export function exitVehicle(input: { numberPlate: string }) {
  return request<ExitResponse>("/exit", { method: "POST", body: JSON.stringify(input) });
}

export function getSlots() {
  return request<Slot[]>("/slots");
}

export function getStatus() {
  return request<Status>("/status");
}

export function getRevenue() {
  return request<Revenue>("/revenue");
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
