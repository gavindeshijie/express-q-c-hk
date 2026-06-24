import { calculateQuote } from "./quote.js";
import { services, trackingStatuses } from "./data.js";

const ORDERS_KEY = "kd_orders";
const LAST_ORDER_KEY = "kd_last_order";
const DRAFT_KEY = "kd_order_draft";

export function getDraft() {
  return readJson(DRAFT_KEY, defaultDraft());
}

export function saveDraft(draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function createOrder(draft) {
  const quote = calculateQuote({
    origin: draft.sender.country,
    destination: draft.recipient.country,
    weight: draft.parcel.weight,
    length: draft.parcel.length,
    width: draft.parcel.width,
    height: draft.parcel.height,
    declaredValue: draft.parcel.declaredValue,
    isDocument: draft.type === "文件",
    hasBattery: draft.parcel.hasBattery,
    hasLiquid: draft.parcel.hasLiquid,
    needInsurance: draft.parcel.needInsurance,
    needPickup: true
  });
  const service = services.find((item) => item.id === draft.serviceId) || services[0];
  const total = Math.round(quote.total * service.factor);
  const order = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    type: draft.type,
    sender: draft.sender,
    recipient: draft.recipient,
    parcel: draft.parcel,
    service,
    quote,
    total,
    eta: service.eta,
    tracking: buildTrackingTimeline()
  };
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 30)));
  localStorage.setItem(LAST_ORDER_KEY, order.id);
  clearDraft();
  return order;
}

export function getOrders() {
  return readJson(ORDERS_KEY, []);
}

export function getOrder(orderId) {
  return getOrders().find((order) => order.id.toUpperCase() === String(orderId || "").trim().toUpperCase());
}

export function getLastOrderId() {
  return localStorage.getItem(LAST_ORDER_KEY) || "";
}

export function defaultDraft() {
  return {
    type: "包裹",
    sender: {
      name: "",
      phone: "",
      email: "",
      country: "中国香港",
      province: "",
      city: "",
      address: "",
      postalCode: ""
    },
    recipient: {
      name: "",
      phone: "",
      email: "",
      country: "美国",
      province: "",
      city: "",
      address: "",
      postalCode: ""
    },
    parcel: {
      count: 1,
      weight: 1,
      length: 25,
      width: 20,
      height: 15,
      itemName: "",
      declaredValue: 100,
      currency: "USD",
      hasBattery: false,
      hasLiquid: false,
      hasPowder: false,
      isBranded: false,
      needInsurance: false
    },
    serviceId: "standard",
    accepted: false
  };
}

function generateOrderId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `KD${y}${m}${d}${random}`;
}

function buildTrackingTimeline() {
  const now = Date.now();
  return trackingStatuses.map((status, index) => ({
    status,
    time: new Date(now + index * 6 * 60 * 60 * 1000).toISOString(),
    done: index <= 2
  }));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
