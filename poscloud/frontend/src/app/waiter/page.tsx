import {
  usePOSStore,
  createOrGetTableOrder,
  createQuickTakeoutOrder,
  addItemToOrder,
  updateItemQuantity,
  startOrderPayment,
  confirmOrderPayment,
  relayOtpToCashier,
  setActiveWaiter,
  Waiter,
  Order,
} from "@/lib/store";
