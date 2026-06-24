import { calculateQuote } from "./quote.js";
import { services, trackingStatuses } from "./data.js";

const ORDERS_KEY = "kd_orders";
const LAST_ORDER_KEY = "kd_last_order";
const DRAFT_KEY = "kd_order_draft";
const CONTACTS_KEY = "kd_contacts";

export function getDraft() {
  return mergeDraft(defaultDraft(), readJson(DRAFT_KEY, {}));
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
    needPickup: draft.pickup.enabled,
    isRemoteArea: draft.recipient.isRemoteArea,
    isResidential: draft.recipient.addressType === "住宅",
    needClearanceSupport: draft.customs.needSupport
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
    pickup: draft.pickup,
    customs: draft.customs,
    status: "待取件",
    paymentStatus: "待支付",
    channel: quote.lane,
    tracking: buildTrackingTimeline()
  };
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 30)));
  localStorage.setItem(LAST_ORDER_KEY, order.id);
  saveContacts(order);
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

export function getContacts() {
  return readJson(CONTACTS_KEY, []);
}

export function getOrderStats() {
  const orders = getOrders();
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const active = orders.filter((order) => order.status !== "已完成").length;
  const risk = orders.filter((order) => order.quote?.riskLevel === "需人工确认").length;
  return {
    totalOrders: orders.length,
    active,
    risk,
    revenue
  };
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
      postalCode: "",
      company: "",
      taxId: "",
      addressType: "商业",
      isRemoteArea: false
    },
    recipient: {
      name: "",
      phone: "",
      email: "",
      country: "美国",
      province: "",
      city: "",
      address: "",
      postalCode: "",
      company: "",
      taxId: "",
      addressType: "商业",
      isRemoteArea: false
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
    pickup: {
      enabled: true,
      date: "",
      window: "09:00-12:00",
      contactNote: ""
    },
    customs: {
      purpose: "个人自用",
      hsCode: "",
      invoiceType: "形式发票",
      needSupport: true,
      remark: ""
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
    location: locationForStatus(status),
    detail: detailForStatus(status),
    time: new Date(now + index * 6 * 60 * 60 * 1000).toISOString(),
    done: index <= 2
  }));
}

function saveContacts(order) {
  const contacts = getContacts();
  const next = [
    {
      type: "寄件人",
      name: order.sender.name,
      phone: order.sender.phone,
      email: order.sender.email,
      country: order.sender.country,
      city: order.sender.city,
      address: order.sender.address
    },
    {
      type: "收件人",
      name: order.recipient.name,
      phone: order.recipient.phone,
      email: order.recipient.email,
      country: order.recipient.country,
      city: order.recipient.city,
      address: order.recipient.address
    },
    ...contacts
  ].filter((item, index, array) => item.name && array.findIndex((entry) => entry.type === item.type && entry.name === item.name && entry.phone === item.phone) === index);
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(next.slice(0, 12)));
}

function locationForStatus(status) {
  const map = {
    订单已创建: "线上平台",
    已收到寄件信息: "资料中心",
    等待上门取件: "取件调度",
    包裹已揽收: "起运城市",
    已到达处理中心: "出口处理中心",
    已离开发件地: "国际机场",
    国际运输中: "跨境运输",
    已到达目的国家: "目的国口岸",
    清关处理中: "海关监管区",
    派送中: "目的地派送站",
    已签收: "收件地址"
  };
  return map[status] || "处理中";
}

function detailForStatus(status) {
  const map = {
    订单已创建: "订单号已生成，等待寄件资料确认。",
    已收到寄件信息: "寄件、收件和包裹资料已进入审核队列。",
    等待上门取件: "系统已生成取件任务，等待取件安排。",
    包裹已揽收: "包裹完成交接，进入起运地扫描流程。",
    已到达处理中心: "包裹正在进行分拣、称重和出口资料核对。",
    已离开发件地: "出口流程完成，等待国际运输衔接。",
    国际运输中: "包裹正在跨境运输途中。",
    已到达目的国家: "包裹已到达目的国家，等待进口处理。",
    清关处理中: "清关资料正在审核，可能需要补充文件。",
    派送中: "包裹已交由目的地派送人员处理。",
    已签收: "包裹已完成签收。"
  };
  return map[status] || "状态已更新。";
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function mergeDraft(base, stored) {
  return {
    ...base,
    ...stored,
    sender: { ...base.sender, ...(stored.sender || {}) },
    recipient: { ...base.recipient, ...(stored.recipient || {}) },
    parcel: { ...base.parcel, ...(stored.parcel || {}) },
    pickup: { ...base.pickup, ...(stored.pickup || {}) },
    customs: { ...base.customs, ...(stored.customs || {}) }
  };
}
