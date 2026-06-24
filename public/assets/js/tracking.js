import { getLastOrderId, getOrder } from "./order.js";
import { trackingStatuses } from "./data.js";

export function findTracking(query) {
  const id = String(query || getLastOrderId() || "").trim();
  const order = getOrder(id);
  if (order) {
    return {
      found: true,
      orderId: order.id,
      service: order.service.name,
      origin: order.sender.country || "待确认",
      destination: order.recipient.country || "待确认",
      eta: order.eta,
      currentStatus: order.tracking.findLast?.((item) => item.done)?.status || "已收到寄件信息",
      timeline: order.tracking
    };
  }
  if (!id) return null;
  return mockTracking(id);
}

function mockTracking(orderId) {
  const now = Date.now();
  const currentIndex = Math.min(6, Math.max(2, orderId.length % trackingStatuses.length));
  return {
    found: true,
    orderId,
    service: "标准快递",
    origin: "中国香港",
    destination: "美国",
    eta: "5-8 个工作日",
    currentStatus: trackingStatuses[currentIndex],
    timeline: trackingStatuses.map((status, index) => ({
      status,
      done: index <= currentIndex,
      time: new Date(now - (currentIndex - index) * 8 * 60 * 60 * 1000).toISOString()
    }))
  };
}
