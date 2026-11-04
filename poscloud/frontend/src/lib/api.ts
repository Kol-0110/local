// API Client for Cloud POS Backend

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    let errorMsg = `API error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      const errorText = await res.text();
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// ======================== AUTH & ROLE TYPES & API ========================

export type UserRole = "super_admin" | "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  status?: "active" | "disabled";
}

export interface RoleDefinition {
  id: UserRole;
  name: string;
  badge: string;
  color: string;
  description: string;
  permissions: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: AuthUser;
  token: string;
}

export async function loginApi(credentials: { email: string; password: string }): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/role/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerApi(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/role/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchCurrentUser(token?: string): Promise<{ success: boolean; user: AuthUser }> {
  return fetchApi<{ success: boolean; user: AuthUser }>("/api/role/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function fetchAllUsers(token?: string): Promise<{ success: boolean; count: number; users: AuthUser[] }> {
  return fetchApi<{ success: boolean; count: number; users: AuthUser[] }>("/api/role/users", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function updateUserRoleApi(params: {
  userId: string;
  newRole: UserRole;
  token?: string;
}): Promise<{ success: boolean; message: string; user: AuthUser }> {
  return fetchApi<{ success: boolean; message: string; user: AuthUser }>("/api/role/change-role", {
    method: "POST",
    headers: params.token ? { Authorization: `Bearer ${params.token}` } : {},
    body: JSON.stringify({
      userId: params.userId,
      newRole: params.newRole,
    }),
  });
}

export async function fetchRolesApi(): Promise<{ success: boolean; roles: RoleDefinition[] }> {
  return fetchApi<{ success: boolean; roles: RoleDefinition[] }>("/api/role/list");
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

// ======================== DAILY SALES SAVED BY DATE ========================

export interface DailySalesRecord {
  id: string;
  date: string;
  branchId: string;
  totalSales: number;
  totalCost: number;
  netProfit: number;
  profitMargin: string;
  totalOrders: number;
  paidOrdersCount: number;
  unpaidOrdersCount: number;
  avgTicket: number;
  moneyBreakdown: {
    cash: number;
    qr: number;
    ussd: number;
    card: number;
  };
  itemsSold: Array<{
    menuItemId?: string;
    name: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    profitMargin?: string;
  }>;
  waiterPerformances: Array<{
    id: string;
    name: string;
    avatar?: string;
    sales: number;
    cost: number;
    profit: number;
    ordersCount: number;
    avgTicket: number;
    cash: number;
    qr: number;
    ussd: number;
    percentageOfTotal: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchDailySales(
  date?: string,
  branchId?: string
): Promise<{ success: boolean; record: DailySalesRecord }> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (branchId) params.append("branchId", branchId);
  const qs = params.toString();
  return fetchApi<{ success: boolean; record: DailySalesRecord }>(`/api/sales/daily${qs ? `?${qs}` : ""}`);
}

export async function fetchDailySalesList(params?: {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  limit?: number;
}): Promise<{ success: boolean; count: number; records: DailySalesRecord[] }> {
  const qs = new URLSearchParams();
  if (params?.startDate) qs.append("startDate", params.startDate);
  if (params?.endDate) qs.append("endDate", params.endDate);
  if (params?.branchId) qs.append("branchId", params.branchId);
  if (params?.limit) qs.append("limit", String(params.limit));
  const queryString = qs.toString();
  return fetchApi<{ success: boolean; count: number; records: DailySalesRecord[] }>(
    `/api/sales/daily${queryString ? `?${queryString}` : ""}`
  );
}

export async function saveDailySalesToDb(
  dailySales: DailySalesRecord
): Promise<{ success: boolean; message: string; record: DailySalesRecord }> {
  return fetchApi<{ success: boolean; message: string; record: DailySalesRecord }>("/api/sales/daily", {
    method: "POST",
    body: JSON.stringify(dailySales),
  });
}

export async function recalculateDailySalesOnDb(
  date?: string,
  branchId?: string
): Promise<{ success: boolean; message: string; record: DailySalesRecord }> {
  return fetchApi<{ success: boolean; message: string; record: DailySalesRecord }>("/api/sales/daily/recalculate", {
    method: "POST",
    body: JSON.stringify({ date, branchId }),
  });
}
