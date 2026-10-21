export interface WaiterRecord {
  id: string;
  name: string;
  pin: string;
  avatar: string;
  phone?: string;
  role: "waiter" | "head_waiter";
  active: boolean;
  todaySales?: number;
  todayCost?: number;
  todayProfit?: number;
  ordersCount?: number;
  cashSales?: number;
  qrSales?: number;
  ussdSales?: number;
  avgTicket?: number;
  updatedAt?: string;
}

export interface OrderItemRecord {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  totalCost: number;
  notes?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  branchId: string;
  tableNumber: number | null;
  orderType: "dine-in" | "takeout";
  items: OrderItemRecord[];
  subtotal: number;
  serviceCharge: number;
  vat: number;
  discountAmount: number;
  totalAmount: number;
  totalCost: number;
  netProfit: number;
  status: "PENDING" | "COOKING" | "READY" | "SERVED" | "PAID";
  paymentStatus: "UNPAID" | "PENDING" | "PAID";
  paymentChannel: "CASH" | "ETHQR" | "USSD_PUSH" | "CARD" | null;
  paymentProvider?: "telebirr" | "cbe" | "cash" | null;
  transactionRef?: string;
  customerName?: string;
  waiterId: string;
  waiterName: string;
  createdAt: string;
  paidAt?: string;
}

export interface ItemConsumptionItem {
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: string;
}

export interface DailyConsumptionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  branchId: string;
  totalSales: number;
  totalCost: number;
  netProfit: number;
  profitMargin: string;
  paidOrdersCount: number;
  moneyBreakdown: {
    cash: number;
    qr: number;
    ussd: number;
    card: number;
  };
  itemsConsumed: ItemConsumptionItem[];
  waiterPerformances: any[];
  savedAt: string;
}
