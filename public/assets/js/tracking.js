import { getLastOrderId, getOrder } from "./order.js";
import { trackingStatuses } from "./data.js";

export function findTracking(query) {
  const id = String(query || getLastOrderId() || "").trim();
  const order = getOrder(id);
  if (order) {
    const current = [...order.tracking].reverse().find((item) => item.done) || order.tracking[0];
    return {
      found: true,
      orderId: order.id,
      service: order.service.name,
      origin: order.sender.country || "待确认",
      destination: order.recipient.country || "待确认",
      eta: order.eta,
      channel: order.channel || order.quote?.lane || "标准渠道",
      paymentStatus: order.paymentStatus || "待支付",
      currentStatus: current?.status || "已收到寄件信息",
      currentLocation: current?.location || "资料中心",
      progress: Math.round((order.tracking.filter((item) => item.done).length / order.tracking.length) * 100),
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
    channel: "北美商务线",
    paymentStatus: "已确认",
    currentStatus: trackingStatuses[currentIndex],
    currentLocation: locationForStatus(trackingStatuses[currentIndex]),
    progress: Math.round(((currentIndex + 1) / trackingStatuses.length) * 100),
    timeline: trackingStatuses.map((status, index) => ({
      status,
      done: index <= currentIndex,
      location: locationForStatus(status),
      detail: detailForStatus(status),
      time: new Date(now - (currentIndex - index) * 8 * 60 * 60 * 1000).toISOString()
    }))
  };
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
    已收到寄件信息: "寄件资料已进入系统。",
    等待上门取件: "取件任务已排队。",
    包裹已揽收: "包裹完成交接扫描。",
    已到达处理中心: "正在进行分拣和出口资料核对。",
    已离开发件地: "出口流程完成，等待航班或干线运输。",
    国际运输中: "包裹正在跨境运输途中。",
    已到达目的国家: "包裹进入目的国家进口流程。",
    清关处理中: "清关资料审核中。",
    派送中: "目的地派送处理中。",
    已签收: "包裹已完成签收。"
  };
  return map[status] || "状态已更新。";
}
