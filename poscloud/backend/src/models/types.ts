export interface WaiterRecord {
  id: string;
  name: string;
  pin: string;
  avatar: string;
  phone?: string;
  role: "waiter" | "head_waiter" | "cashier" | "owner";
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

export type OrderStatus =
  | "PENDING"
  | "COOKING"
  | "READY"
  | "SERVED"
  | "BILL_REQUESTED"
  | "PAID"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "AWAITING_PAYMENT" | "PAID" | "FAILED";
export type PaymentChannel = "CASH" | "ETHQR" | "USSD_PUSH" | "CARD" | null;

export interface PaymentAttemptRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  method: Exclude<PaymentChannel, null>;
  amount: number;
  status: "pending" | "success" | "failed";
  provider?: "telebirr" | "cbe" | "cash" | "ethqr";
  providerRef?: string;
  /** OTP relayed from waiter to cashier (short-lived, not proof by itself) */
  otpCode?: string;
  confirmedBy?: string;
  createdAt: string;
  confirmedAt?: string;
  note?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string; // human Order ID shown on bill e.g. ORD-1042
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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentChannel: PaymentChannel;
  paymentProvider?: "telebirr" | "cbe" | "cash" | "ethqr" | null;
  transactionRef?: string;
  /** Same waiter owns order from create → paid */
  waiterId: string;
  waiterName: string;
  cashierId?: string;
  cashierName?: string;
  customerName?: string;
  activePaymentAttemptId?: string;
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
  date: string;
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
