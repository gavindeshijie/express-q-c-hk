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

  if (input.hasBattery) surcharges.push({ label: "带电产品附加费", amount: 80 });
  if (input.hasLiquid) surcharges.push({ label: "液体产品附加费", amount: 120 });
  if (input.needInsurance) surcharges.push({ label: "保险费用", amount: declaredValue * 0.02 });
  if (input.needPickup) surcharges.push({ label: "上门取件", amount: 30 });

  const surchargeTotal = surcharges.reduce((sum, item) => sum + item.amount, 0);
  const total = baseFee + surchargeTotal;

  return {
    origin: input.origin,
    destination: input.destination,
    destinationRegion,
    rate: rateConfig.rate,
    eta: rateConfig.eta,
    weight,
    volumetricWeight: round(volumetricWeight),
    chargeableWeight: round(chargeableWeight),
    baseFee: round(baseFee),
    surcharges: surcharges.map((item) => ({ ...item, amount: round(item.amount) })),
    surchargeTotal: round(surchargeTotal),
    total: round(total),
    formattedTotal: money.format(total),
    serviceType: input.isDocument ? "文件快递" : "国际包裹",
    notes: buildNotes(input)
  };
}

export function formatMoney(amount) {
  return money.format(Number(amount || 0));
}

function buildNotes(input) {
  const notes = ["价格为模拟估算，实际费用以最终审核和承运渠道为准。"];
  if (input.hasBattery) notes.push("带电产品需提前确认电池类型、功率和包装要求。");
  if (input.hasLiquid) notes.push("液体类物品可能存在渠道限制，请先联系客服确认。");
  if (input.needInsurance) notes.push("保险费用按申报价值模拟计算，后续可接入真实保险规则。");
  return notes;
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
