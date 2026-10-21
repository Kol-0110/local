// API Client for Cloud POS Backend

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:5000");

export interface ApiStatus {
  status: "ready" | "connected" | "fallback";
  database: "mongodb" | "local_memory";
  message: string;
  connected: boolean;
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export async function getServerStatus(): Promise<ApiStatus> {
  return fetchApi<ApiStatus>("/api/status");
}

export async function syncOrderToServer(order: any) {
  return fetchApi("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function bulkSaveOrdersToDb(orders: any[]) {
  return fetchApi("/api/orders", {
    method: "POST",
    body: JSON.stringify(orders),
  });
}

export async function fetchServerOrders(date?: string, waiterId?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (waiterId) params.append("waiterId", waiterId);
  const qs = params.toString();
  return fetchApi<{ success: boolean; count: number; orders: any[] }>(`/api/orders${qs ? `?${qs}` : ""}`);
}

export async function fetchWaiters(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return fetchApi<{ success: boolean; waiters: any[] }>(`/api/waiters${qs}`);
}

export async function saveWaiterToDb(waiter: any) {
  return fetchApi("/api/waiters", {
    method: "POST",
    body: JSON.stringify(waiter),
  });
}

export async function saveDailyConsumptionToDb(consumption: any) {
  return fetchApi("/api/consumption", {
    method: "POST",
    body: JSON.stringify(consumption),
  });
}

export async function fetchDailyConsumption(date?: string, branchId?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (branchId) params.append("branchId", branchId);
  const qs = params.toString();
  return fetchApi<{ success: boolean; count: number; records: any[] }>(`/api/consumption${qs ? `?${qs}` : ""}`);
}

export async function syncAllToMongoDb(payload: {
  orders?: any[];
  waiters?: any[];
  consumption?: any;
}) {
  return fetchApi<{
    success: boolean;
    ordersSaved: number;
    waitersSaved: number;
    consumptionSaved: boolean;
    timestamp: string;
  }>("/api/consumption/sync-all", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTodayReport(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  return fetchApi(`/api/reports/today${qs}`);
}
