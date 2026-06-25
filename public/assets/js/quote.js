import { countries, dutyProfiles, hsCodeSamples, regionRates } from "./data.js";

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

export function estimateDuty(input) {
  const destinationRegion = getRegion(input.destination);
  const profile = dutyProfiles.find((item) => item.region === destinationRegion) || dutyProfiles.find((item) => item.region === "其他地区");
  const declaredValue = positive(input.declaredValue);
  const freight = positive(input.freight);
  const dutyBase = declaredValue + freight;
  const duty = dutyBase * profile.duty;
  const vat = (dutyBase + duty) * profile.vat;
  const total = duty + vat + profile.clearanceFee;
  return {
    destinationRegion,
    declaredValue,
    freight,
    dutyRate: profile.duty,
    vatRate: profile.vat,
    clearanceFee: profile.clearanceFee,
    duty: round(duty),
    vat: round(vat),
    total: round(total),
    incoterm: input.incoterm || "DDU",
    notes: [
      "税费为模拟估算，真实金额以目的国家海关和承运渠道为准。",
      input.incoterm === "DDP" ? "DDP 表示寄件方预付税费，适合提升收件体验。" : "DDU 表示税费可能由收件人支付，需提前告知收件人。"
    ]
  };
}

export function lookupHsCode(keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return hsCodeSamples;
  const result = hsCodeSamples.filter((item) => {
    return `${item.keyword} ${item.code} ${item.name} ${item.note}`.toLowerCase().includes(query);
  });
  return result.length ? result : [hsCodeSamples[hsCodeSamples.length - 1]];
}

export function scoreAddress(input) {
  const checks = [
    { label: "姓名", ok: Boolean(String(input.name || "").trim()) },
    { label: "电话", ok: Boolean(String(input.phone || "").trim()) },
    { label: "邮箱", ok: /@/.test(String(input.email || "")) },
    { label: "国家/地区", ok: Boolean(String(input.country || "").trim()) },
    { label: "城市", ok: Boolean(String(input.city || "").trim()) },
    { label: "详细地址", ok: String(input.address || "").trim().length >= 8 },
    { label: "邮编", ok: Boolean(String(input.postalCode || "").trim()) },
    { label: "税号或识别号", ok: Boolean(String(input.taxId || "").trim()) || input.addressType !== "商业" }
  ];
  const passed = checks.filter((item) => item.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    score,
    level: score >= 90 ? "优秀" : score >= 70 ? "可用" : "需补充",
    checks,
    suggestions: checks.filter((item) => !item.ok).map((item) => `补充${item.label}`)
  };
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
