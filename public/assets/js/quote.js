import { countries, regionRates } from "./data.js";

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});

export function getRegion(countryName) {
  return countries.find((item) => item.name === countryName)?.region || "其他地区";
}

export function calculateQuote(input) {
  const weight = positive(input.weight);
  const length = positive(input.length);
  const width = positive(input.width);
  const height = positive(input.height);
  const declaredValue = positive(input.declaredValue);
  const destinationRegion = getRegion(input.destination);
  const rateConfig = regionRates[destinationRegion] || regionRates["其他地区"];
  const volumetricWeight = length && width && height ? (length * width * height) / 5000 : 0;
  const chargeableWeight = Math.max(weight, volumetricWeight, 0.5);
  const baseFee = chargeableWeight * rateConfig.rate;
  const surcharges = [];
  const fuelFee = baseFee * 0.12;
  const handlingFee = chargeableWeight >= 20 ? 80 : 35;

  if (input.hasBattery) surcharges.push({ label: "带电产品附加费", amount: 80 });
  if (input.hasLiquid) surcharges.push({ label: "液体产品附加费", amount: 120 });
  if (input.needInsurance) surcharges.push({ label: "保险费用", amount: declaredValue * 0.02 });
  if (input.needPickup) surcharges.push({ label: "上门取件", amount: 30 });
  if (input.isRemoteArea) surcharges.push({ label: "偏远地区派送", amount: 160 });
  if (input.needClearanceSupport) surcharges.push({ label: "清关资料协助", amount: 50 });
  if (input.isResidential) surcharges.push({ label: "住宅地址派送", amount: 25 });
  surcharges.unshift({ label: "燃油与操作费", amount: fuelFee + handlingFee });

  const surchargeTotal = surcharges.reduce((sum, item) => sum + item.amount, 0);
  const total = baseFee + surchargeTotal;

  return {
    origin: input.origin,
    destination: input.destination,
    destinationRegion,
    rate: rateConfig.rate,
    eta: rateConfig.eta,
    lane: rateConfig.lane,
    clearance: rateConfig.clearance,
    weight,
    volumetricWeight: round(volumetricWeight),
    chargeableWeight: round(chargeableWeight),
    baseFee: round(baseFee),
    surcharges: surcharges.map((item) => ({ ...item, amount: round(item.amount) })),
    surchargeTotal: round(surchargeTotal),
    total: round(total),
    formattedTotal: money.format(total),
    serviceType: input.isDocument ? "文件快递" : "国际包裹",
    notes: buildNotes(input, rateConfig),
    riskLevel: getRiskLevel(input, destinationRegion, declaredValue),
    checklist: buildChecklist(input)
  };
}

export function formatMoney(amount) {
  return money.format(Number(amount || 0));
}

function buildNotes(input, rateConfig) {
  const notes = ["价格为模拟估算，实际费用以最终审核和承运渠道为准。"];
  notes.push(`当前匹配 ${rateConfig.lane}，预计清关复杂度：${rateConfig.clearance}。`);
  if (input.hasBattery) notes.push("带电产品需提前确认电池类型、功率和包装要求。");
  if (input.hasLiquid) notes.push("液体类物品可能存在渠道限制，请先联系客服确认。");
  if (input.needInsurance) notes.push("保险费用按申报价值模拟计算，后续可接入真实保险规则。");
  if (input.isRemoteArea) notes.push("偏远地区可能产生额外派送费和时效延长。");
  if (input.needClearanceSupport) notes.push("清关协助仅为资料整理模拟项，真实清关以目的国要求为准。");
  return notes;
}

function buildChecklist(input) {
  const list = ["收寄双方英文地址", "物品名称、数量、价值", "外箱尺寸与重量"];
  if (!input.isDocument) list.push("商业发票或形式发票");
  if (input.hasBattery) list.push("电池类型和功率资料");
  if (input.hasLiquid) list.push("成分说明和防漏包装照片");
  if (input.needInsurance) list.push("购买凭证或价值证明");
  return list;
}

function getRiskLevel(input, destinationRegion, declaredValue) {
  let score = 0;
  if (input.hasBattery) score += 2;
  if (input.hasLiquid) score += 2;
  if (input.isRemoteArea) score += 1;
  if (declaredValue >= 1000) score += 1;
  if (destinationRegion === "其他地区") score += 1;
  if (input.needClearanceSupport) score += 1;
  if (score >= 4) return "需人工确认";
  if (score >= 2) return "中等";
  return "较低";
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
