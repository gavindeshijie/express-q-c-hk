import {
  advantages,
  cargoTypes,
  countries,
  currencies,
  controlTowerMetrics,
  documentChecklist,
  faqs,
  flowSteps,
  helpCategories,
  integrationRoadmap,
  packagingScenarios,
  packagingTips,
  pickupWindows,
  prohibitedItems,
  prohibitedCategories,
  quickActions,
  riskRules,
  routeHighlights,
  serviceMatrix,
  services,
  shipmentTypes
} from "./data.js";
import { calculateQuote, formatMoney } from "./quote.js";
import { createOrder, defaultDraft, getContacts, getDraft, getLastOrderId, getOrder, getOrders, getOrderStats, saveDraft } from "./order.js";
import { findTracking } from "./tracking.js";

const app = document.querySelector("#app");
let pageState = {
  quoteResult: null,
  trackingResult: null
};

window.addEventListener("hashchange", render);
render();

function render() {
  const route = getRoute();
  const content = renderRoute(route);
  app.innerHTML = `
    <div class="site-shell">
      ${renderHeader(route.path)}
      <main class="main">${content}</main>
      ${renderFooter()}
    </div>
  `;
  bindPage(route);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function getRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryString = ""] = raw.split("?");
  return { path, params: new URLSearchParams(queryString) };
}

function renderRoute(route) {
  const path = route.path;
  if (path === "/" || path === "/home") return renderHome();
  if (path === "/quote") return renderQuotePage();
  if (path === "/ship") return renderShipmentPage(Number(route.params.get("step") || 1));
  if (path === "/sender") return renderShipmentPage(2);
  if (path === "/recipient") return renderShipmentPage(3);
  if (path === "/parcel") return renderShipmentPage(4);
  if (path === "/confirm") return renderShipmentPage(7);
  if (path === "/success") return renderSuccessPage(route.params.get("order") || getLastOrderId());
  if (path === "/tracking") return renderTrackingPage(route.params.get("order") || "");
  if (path === "/packaging") return renderPackagingPage();
  if (path === "/prohibited") return renderProhibitedPage();
  if (path === "/help") return renderHelpPage();
  if (path === "/contact") return renderContactPage();
  if (path === "/account") return renderAccountPage();
  if (path === "/admin") return renderAdminPage();
  return renderNotFound();
}

function renderHeader(activePath) {
  const links = [
    ["/", "首页"],
    ["/ship", "寄件"],
    ["/quote", "查询价格"],
    ["/tracking", "物流查询"],
    ["/packaging", "打包指南"],
    ["/prohibited", "禁寄品"],
    ["/help", "帮助中心"],
    ["/contact", "联系"]
  ];
  return `
    <header class="header" id="site-header">
      <div class="top-strip">
        <div class="container top-strip-inner">
          <span>快递自助寄件平台</span>
          <span>模拟报价 · 模拟订单 · GitHub Pages 静态部署</span>
        </div>
      </div>
      <div class="container nav">
        <a class="brand" href="#/">
          <span class="brand-mark">KD</span>
          <span><strong>快递</strong><small>Global Express</small></span>
        </a>
        <nav class="nav-links" aria-label="主导航">
          ${links.map(([href, label]) => `<a class="nav-link ${isActive(activePath, href) ? "active" : ""}" href="#${href}">${label}</a>`).join("")}
        </nav>
        <div class="nav-actions">
          <a class="btn secondary" href="#/account">登录 / 注册</a>
        </div>
        <button class="mobile-toggle" type="button" aria-label="打开导航菜单" data-menu-toggle>
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container footer-inner">
        <div>
          <h3>快递</h3>
          <p>面向个人和小型商家的国际快递自助寄件平台，支持在线报价、创建订单和物流查询。</p>
        </div>
        <div>
          <h4>服务</h4>
          <a href="#/quote">查询价格</a>
          <a href="#/ship">创建订单</a>
          <a href="#/tracking">物流查询</a>
          <a href="#/packaging">打包指南</a>
        </div>
        <div>
          <h4>信息</h4>
          <a href="#/prohibited">禁寄品说明</a>
          <a href="#/help">常见问题</a>
          <a href="#/contact">联系我们</a>
          <a href="#/admin">管理后台</a>
        </div>
        <div>
          <h4>后续扩展</h4>
          <a href="#/account">用户中心</a>
          <a href="#/admin">运营看板</a>
          <a href="#/quote">渠道报价</a>
          <a href="#/tracking">轨迹通知</a>
        </div>
      </div>
      <div class="container footer-bottom">© ${new Date().getFullYear()} 快递自助寄件平台。当前为前端演示版本，费用与时效为模拟数据。</div>
    </footer>
  `;
}

function renderHome() {
  return `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">快递国际</span>
          <h1>国际快递，自助下单，轻松寄全球</h1>
          <p>面向个人寄件、样品寄送和小型跨境电商的自助平台。在线报价、资料校验、服务选择、订单生成、物流追踪都先跑通，后续可继续接真实渠道、支付和后台。</p>
          <div class="hero-actions">
            <a class="btn orange" href="#/ship">立即寄件</a>
            <a class="btn secondary" href="#/tracking">查询物流</a>
          </div>
          <div class="hero-metrics">
            ${controlTowerMetrics.slice(0, 3).map(([label, value, text]) => `
              <div>
                <strong>${value}</strong>
                <span>${label}</span>
                <small>${text}</small>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="hero-panel">
          <div class="quick-quote">
            <div class="panel-title">
              <span class="panel-kicker">Quick Rate</span>
              <h2>快速估算</h2>
            </div>
            ${renderQuoteForm("home-quote-form", true)}
            <div id="home-quote-result"></div>
          </div>
        </div>
      </div>
    </section>
    <section class="control-band">
      <div class="container control-grid">
        ${controlTowerMetrics.map(([label, value, text]) => `
          <div class="control-card">
            <span>${label}</span>
            <strong>${value}</strong>
            <small>${text}</small>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2>快捷操作</h2>
            <p>常用寄件动作放在首页，个人寄件也能快速完成。</p>
          </div>
        </div>
        <div class="grid four">
          ${quickActions.map((item) => `
            <a class="card action-card" href="${item.href}">
              <span class="icon-tile">${item.icon}</span>
              <span>
                <h3>${item.title}</h3>
                <p>${item.text}</p>
              </span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="section dark-section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow light">Global Routing</span>
            <h2>国际线路与服务层级</h2>
            <p>用自己的品牌方式呈现国际快递流程：线路、时效、费用、清关和追踪都可以逐步模块化。</p>
          </div>
          <a class="btn secondary" href="#/quote">查看报价</a>
        </div>
        <div class="route-layout">
          <div class="route-map-card">
            <div class="route-map-header">
              <strong>Route Control</strong>
              <span>Asia · Europe · North America · Oceania</span>
            </div>
            <div class="route-bars">
              ${routeHighlights.map(([title, countriesText], index) => `
                <div class="route-bar">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${title}</strong>
                  <small>${countriesText}</small>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="grid two route-cards">
            ${routeHighlights.map(([title, countriesText, desc]) => `
              <div class="glass-card">
                <h3>${title}</h3>
                <p>${countriesText}</p>
                <small>${desc}</small>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2>服务优势</h2>
            <p>第一版先做清楚流程，后续可以接入真实渠道、支付、取件和客服工具。</p>
          </div>
        </div>
        <div class="grid three">
          ${advantages.map(([title, text], index) => `
            <div class="card">
              <span class="icon-tile">${index + 1}</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2>服务等级</h2>
            <p>先用模拟服务做清晰选择，后续可以映射真实承运渠道、价格规则和面单产品。</p>
          </div>
        </div>
        <div class="comparison-table">
          <div class="comparison-row head">
            <span>服务</span><span>预计时效</span><span>适用场景</span><span>特点</span>
          </div>
          ${serviceMatrix.map((row) => `
            <div class="comparison-row">
              ${row.map((cell) => `<span>${cell}</span>`).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2>寄件流程</h2>
            <p>从估价到查询，按步骤推进，降低漏填资料和包装不合规的风险。</p>
          </div>
        </div>
        <div class="grid three">
          ${flowSteps.map((step, index) => `
            <div class="card">
              <span class="icon-tile">${String(index + 1).padStart(2, "0")}</span>
              <h3>${step}</h3>
              <p>${flowText(step)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="split-panel">
          <div>
            <span class="eyebrow">Ready Checklist</span>
            <h2>寄件前资料清单</h2>
            <p>国际快递不是只填一个地址。提前准备申报、包装、价值和联系人资料，可以减少清关延误。</p>
            <a class="btn" href="#/ship">开始创建订单</a>
          </div>
          <div class="checklist-grid">
            ${documentChecklist.map(([title, text]) => `
              <div class="checklist-item">
                <strong>${title}</strong>
                <span>${text}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <div>
            <h2>后续扩展路线</h2>
            <p>当前是静态前端和本地模拟数据，接口层已经按后续扩展方向拆分。</p>
          </div>
        </div>
        <div class="grid three">
          ${integrationRoadmap.map(([title, text], index) => `
            <div class="card roadmap-card">
              <span class="icon-tile">${index + 1}</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderQuotePage() {
  return `
    ${renderPageHead("在线报价", "输入包裹重量、尺寸和货物属性，获取模拟费用、计费重量和预计时效。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3>计费说明</h3>
          <p>体积重 = 长 × 宽 × 高 ÷ 5000。计费重量取实际重量和体积重较大值。</p>
          <div class="mini-list">
            <span>基础运费：计费重量 × 目的地区单价</span>
            <span>附加费：燃油、操作、带电、液体、保险、取件等</span>
            <span>输出：费用、时效、线路、风险等级和资料清单</span>
          </div>
          <div class="notice">报价为演示估算，真实价格需以后端渠道规则为准。</div>
        </aside>
        <div class="card">
          ${renderQuoteForm("quote-form", false)}
          <div id="quote-result">${pageState.quoteResult ? renderQuoteResult(pageState.quoteResult) : ""}</div>
        </div>
      </div>
    </section>
  `;
}

function renderQuoteForm(formId, compact) {
  const countryOptions = countries.map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
  const cargoOptions = cargoTypes.map((item) => `<option value="${item}">${item}</option>`).join("");
  return `
    <form id="${formId}" class="quote-form" novalidate>
      <div class="form-grid ${compact ? "" : "three"}">
        <div class="field">
          <label>起运国家/地区 *</label>
          <select name="origin" required>
            ${countryOptions}
          </select>
        </div>
        <div class="field">
          <label>目的国家/地区 *</label>
          <select name="destination" required>
            ${countryOptions}
          </select>
        </div>
        <div class="field">
          <label>包裹重量 kg *</label>
          <input name="weight" type="number" min="0.1" step="0.1" value="1" required>
        </div>
        <div class="field">
          <label>长 cm *</label>
          <input name="length" type="number" min="1" step="1" value="25" required>
        </div>
        <div class="field">
          <label>宽 cm *</label>
          <input name="width" type="number" min="1" step="1" value="20" required>
        </div>
        <div class="field">
          <label>高 cm *</label>
          <input name="height" type="number" min="1" step="1" value="15" required>
        </div>
        <div class="field">
          <label>物品类型</label>
          <select name="cargoType">${cargoOptions}</select>
        </div>
        <div class="field">
          <label>申报价值 CNY</label>
          <input name="declaredValue" type="number" min="0" step="1" value="100">
        </div>
      </div>
      <div class="check-row" style="margin-top:14px">
        <label class="chip-check"><input name="isDocument" type="checkbox"> 文件</label>
        <label class="chip-check"><input name="hasBattery" type="checkbox"> 带电</label>
        <label class="chip-check"><input name="hasLiquid" type="checkbox"> 液体</label>
        <label class="chip-check"><input name="needInsurance" type="checkbox"> 保险</label>
        <label class="chip-check"><input name="needPickup" type="checkbox"> 上门取件</label>
        <label class="chip-check"><input name="isRemoteArea" type="checkbox"> 偏远地区</label>
        <label class="chip-check"><input name="isResidential" type="checkbox"> 住宅地址</label>
        <label class="chip-check"><input name="needClearanceSupport" type="checkbox"> 清关协助</label>
      </div>
      <div class="form-actions">
        <span class="muted">当前使用模拟报价规则。</span>
        <button class="btn orange" type="submit">计算价格</button>
      </div>
    </form>
  `;
}

function renderQuoteResult(result) {
  return `
    <div class="result-box" style="margin-top:18px">
      <div class="result-main">
        <div>
          <strong>预计费用</strong>
          <div class="price">${result.formattedTotal}</div>
        </div>
        <a class="btn" href="#/ship">继续下单</a>
      </div>
      <div class="stat-grid">
        <div class="stat"><span class="muted">计费重量</span><strong>${result.chargeableWeight} kg</strong></div>
        <div class="stat"><span class="muted">预计时效</span><strong>${result.eta}</strong></div>
        <div class="stat"><span class="muted">服务类型</span><strong>${result.serviceType}</strong></div>
        <div class="stat"><span class="muted">推荐线路</span><strong>${result.lane}</strong></div>
        <div class="stat"><span class="muted">清关复杂度</span><strong>${result.clearance}</strong></div>
        <div class="stat"><span class="muted">风险等级</span><strong>${result.riskLevel}</strong></div>
      </div>
      <div>
        <strong>费用明细</strong>
        <div class="fee-list">
          <div><span>基础运费</span><strong>${formatMoney(result.baseFee)}</strong></div>
          ${result.surcharges.map((item) => `<div><span>${item.label}</span><strong>${formatMoney(item.amount)}</strong></div>`).join("")}
          <div class="total"><span>预计总额</span><strong>${result.formattedTotal}</strong></div>
        </div>
      </div>
      <div>
        <strong>下单前建议准备</strong>
        <div class="tag-list">${result.checklist.map((item) => `<span>${item}</span>`).join("")}</div>
      </div>
      <ul class="muted clean-list">
        ${result.notes.map((note) => `<li>${note}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderShipmentPage(step) {
  const safeStep = Math.min(7, Math.max(1, step || 1));
  const draft = getDraft();
  return `
    ${renderPageHead("创建寄件订单", "按步骤填写资料并生成模拟订单号。当前不接真实支付、取件或物流 API。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <div class="step-list">
            ${["寄件类型", "寄件人信息", "收件人信息", "包裹信息", "清关与取件", "选择服务", "订单确认"].map((label, index) => `
              <a class="step-item ${safeStep === index + 1 ? "active" : ""}" href="#/ship?step=${index + 1}">
                <span class="step-number">${index + 1}</span>
                <span>${label}</span>
              </a>
            `).join("")}
          </div>
          <div class="side-summary">
            <h3>订单草稿</h3>
            <p>${draft.sender.country || "起运地"} → ${draft.recipient.country || "目的地"}</p>
            <p>${draft.parcel.count || 1} 件，${draft.parcel.weight || 0} kg / 件</p>
            <span>${draft.type}</span>
          </div>
        </aside>
        <div class="card">
          ${renderShipmentStep(safeStep, draft)}
        </div>
      </div>
    </section>
  `;
}

function renderShipmentStep(step, draft) {
  if (step === 1) return renderTypeStep(draft);
  if (step === 2) return renderAddressStep("sender", "寄件人信息", draft.sender);
  if (step === 3) return renderAddressStep("recipient", "收件人信息", draft.recipient);
  if (step === 4) return renderParcelStep(draft.parcel);
  if (step === 5) return renderCustomsStep(draft);
  if (step === 6) return renderServiceStep(draft);
  return renderConfirmStep(draft);
}

function renderTypeStep(draft) {
  return `
    <h2>第 1 步：选择寄件类型</h2>
    <form id="shipment-step-form" data-step="1" novalidate>
      <div class="radio-row">
        ${shipmentTypes.map((type) => `
          <label class="chip-radio">
            <input type="radio" name="type" value="${type}" ${draft.type === type ? "checked" : ""}>
            ${type}
          </label>
        `).join("")}
      </div>
      ${renderStepActions(1)}
    </form>
  `;
}

function renderAddressStep(kind, title, data) {
  const countryOptions = countries.map((item) => `<option value="${item.name}" ${data.country === item.name ? "selected" : ""}>${item.name}</option>`).join("");
  return `
    <h2>${kind === "sender" ? "第 2 步" : "第 3 步"}：${title}</h2>
    <form id="shipment-step-form" data-step="${kind === "sender" ? 2 : 3}" novalidate>
      <div class="form-grid">
        ${input("name", "姓名", data.name, true)}
        ${input("company", "公司名称", data.company || "", false)}
        ${input("phone", "电话", data.phone, true)}
        ${input("email", "邮箱", data.email, true, "email")}
        <div class="field">
          <label>国家/地区 *</label>
          <select name="country" required>${countryOptions}</select>
        </div>
        ${input("taxId", "税号 / 识别号", data.taxId || "", false)}
        ${input("province", "省/州", data.province, true)}
        ${input("city", "城市", data.city, true)}
        ${input("postalCode", "邮编", data.postalCode, true)}
        <div class="field">
          <label>地址类型 *</label>
          <select name="addressType" required>
            <option ${data.addressType === "商业" ? "selected" : ""}>商业</option>
            <option ${data.addressType === "住宅" ? "selected" : ""}>住宅</option>
          </select>
        </div>
        <div class="field full">
          <label>地址 *</label>
          <textarea name="address" required>${escapeHtml(data.address)}</textarea>
        </div>
      </div>
      <div class="check-row" style="margin-top:14px">
        <label class="chip-check"><input name="isRemoteArea" type="checkbox" ${data.isRemoteArea ? "checked" : ""}> 可能是偏远地区</label>
      </div>
      ${renderStepActions(kind === "sender" ? 2 : 3)}
    </form>
  `;
}

function renderParcelStep(parcel) {
  const currencyOptions = currencies.map((item) => `<option value="${item}" ${parcel.currency === item ? "selected" : ""}>${item}</option>`).join("");
  return `
    <h2>第 4 步：填写包裹信息</h2>
    <div class="notice soft-notice">请如实填写物品属性。带电、液体、粉末、品牌商品和高价值货物，后续接真实渠道时通常需要额外审核。</div>
    <form id="shipment-step-form" data-step="4" novalidate>
      <div class="form-grid three">
        ${input("count", "包裹数量", parcel.count, true, "number", "1")}
        ${input("weight", "每件重量 kg", parcel.weight, true, "number", "0.1")}
        ${input("length", "长 cm", parcel.length, true, "number", "1")}
        ${input("width", "宽 cm", parcel.width, true, "number", "1")}
        ${input("height", "高 cm", parcel.height, true, "number", "1")}
        ${input("itemName", "物品名称", parcel.itemName, true)}
        ${input("declaredValue", "申报价值", parcel.declaredValue, true, "number", "1")}
        <div class="field">
          <label>货币 *</label>
          <select name="currency" required>${currencyOptions}</select>
        </div>
      </div>
      <div class="check-row" style="margin-top:14px">
        ${parcelCheck("hasBattery", "是否带电", parcel.hasBattery)}
        ${parcelCheck("hasLiquid", "是否液体", parcel.hasLiquid)}
        ${parcelCheck("hasPowder", "是否粉末", parcel.hasPowder)}
        ${parcelCheck("isBranded", "是否品牌商品", parcel.isBranded)}
        ${parcelCheck("needInsurance", "是否需要保险", parcel.needInsurance)}
      </div>
      ${renderStepActions(4)}
    </form>
  `;
}

function renderCustomsStep(draft) {
  const windowOptions = pickupWindows.map((item) => `<option value="${item}" ${draft.pickup.window === item ? "selected" : ""}>${item}</option>`).join("");
  return `
    <h2>第 5 步：清关与取件</h2>
    <form id="shipment-step-form" data-step="5" novalidate>
      <div class="form-grid">
        <div class="field">
          <label>寄件用途 *</label>
          <select name="purpose" required>
            ${["个人自用", "商业样品", "销售商品", "维修返还", "礼品", "文件资料"].map((item) => `<option ${draft.customs.purpose === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </div>
        ${input("hsCode", "HS Code", draft.customs.hsCode || "", false)}
        <div class="field">
          <label>发票类型 *</label>
          <select name="invoiceType" required>
            ${["形式发票", "商业发票", "无需发票"].map((item) => `<option ${draft.customs.invoiceType === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>预约取件日期</label>
          <input name="pickupDate" type="date" value="${escapeHtml(draft.pickup.date || "")}">
        </div>
        <div class="field">
          <label>取件时间段</label>
          <select name="pickupWindow">${windowOptions}</select>
        </div>
        <div class="field full">
          <label>取件或清关备注</label>
          <textarea name="remark">${escapeHtml(draft.customs.remark || draft.pickup.contactNote || "")}</textarea>
        </div>
      </div>
      <div class="check-row" style="margin-top:14px">
        <label class="chip-check"><input name="pickupEnabled" type="checkbox" ${draft.pickup.enabled ? "checked" : ""}> 需要上门取件</label>
        <label class="chip-check"><input name="needSupport" type="checkbox" ${draft.customs.needSupport ? "checked" : ""}> 需要清关资料协助</label>
      </div>
      <div class="risk-grid">
        ${riskRules.slice(0, 4).map(([title, text]) => `
          <div class="risk-card">
            <strong>${title}</strong>
            <span>${text}</span>
          </div>
        `).join("")}
      </div>
      ${renderStepActions(5)}
    </form>
  `;
}

function renderServiceStep(draft) {
  const baseQuote = calculateQuote({
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
  return `
    <h2>第 6 步：选择服务</h2>
    <form id="shipment-step-form" data-step="6" novalidate>
      <div class="service-quote-summary">
        <div><span>推荐线路</span><strong>${baseQuote.lane}</strong></div>
        <div><span>计费重量</span><strong>${baseQuote.chargeableWeight} kg</strong></div>
        <div><span>风险等级</span><strong>${baseQuote.riskLevel}</strong></div>
      </div>
      <div class="service-options">
        ${services.map((service) => `
          <label class="service-option">
            <input type="radio" name="serviceId" value="${service.id}" ${draft.serviceId === service.id ? "checked" : ""}>
            <span>
              <strong>${service.name}</strong><br>
              <span class="muted">时效：${service.eta}。${service.note}</span>
            </span>
            <strong>${formatMoney(baseQuote.total * service.factor)}</strong>
          </label>
        `).join("")}
      </div>
      ${renderStepActions(5)}
    </form>
  `;
}

function renderConfirmStep(draft) {
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
  const total = quote.total * service.factor;
  return `
    <h2>第 7 步：订单确认</h2>
    <div class="grid two">
      ${summaryCard("寄件人信息", draft.sender)}
      ${summaryCard("收件人信息", draft.recipient)}
    </div>
    <div class="card" style="margin-top:16px;box-shadow:none">
      <h3>包裹与费用</h3>
      <div class="summary-list">
        <div class="summary-row"><span>寄件类型</span><strong>${draft.type}</strong></div>
        <div class="summary-row"><span>包裹</span><strong>${draft.parcel.count} 件，${draft.parcel.weight} kg / 件，${draft.parcel.length} × ${draft.parcel.width} × ${draft.parcel.height} cm</strong></div>
        <div class="summary-row"><span>物品</span><strong>${escapeHtml(draft.parcel.itemName || "未填写")}</strong></div>
        <div class="summary-row"><span>服务</span><strong>${service.name}，${service.eta}</strong></div>
        <div class="summary-row"><span>线路</span><strong>${quote.lane}</strong></div>
        <div class="summary-row"><span>计费重量</span><strong>${quote.chargeableWeight} kg</strong></div>
        <div class="summary-row"><span>风险等级</span><strong>${quote.riskLevel}</strong></div>
        <div class="summary-row"><span>清关资料</span><strong>${draft.customs.invoiceType} / ${draft.customs.purpose}</strong></div>
        <div class="summary-row"><span>取件安排</span><strong>${draft.pickup.enabled ? `${draft.pickup.date || "待确认"} ${draft.pickup.window}` : "无需上门取件"}</strong></div>
        <div class="summary-row"><span>预计费用</span><strong>${formatMoney(total)}</strong></div>
      </div>
    </div>
    <form id="shipment-step-form" data-step="7" novalidate>
      <label class="chip-check" style="margin-top:16px">
        <input name="accepted" type="checkbox" ${draft.accepted ? "checked" : ""} required>
        我确认以上资料真实有效，并了解费用与时效为模拟估算。
      </label>
      ${renderStepActions(6, "提交订单")}
    </form>
  `;
}

function renderStepActions(step, nextLabel = "下一步") {
  return `
    <div class="form-actions">
      <a class="btn secondary" href="#/ship?step=${Math.max(1, step - 1)}" ${step === 1 ? "style=\"visibility:hidden\"" : ""}>上一步</a>
      <button class="btn orange" type="submit">${nextLabel}</button>
    </div>
  `;
}

function renderSuccessPage(orderId) {
  const order = getOrder(orderId);
  if (!order) return renderPlaceholder("订单成功", "未找到订单记录。你可以重新创建订单，或到物流查询页输入订单号。");
  return `
    ${renderPageHead("订单提交成功", "订单已保存到本地模拟数据，后续可以接入真实订单系统。")}
    <section class="section tight">
      <div class="container">
        <div class="card success-panel">
          <div class="success-mark">✓</div>
          <h2>订单提交成功</h2>
          <p class="muted">请保存订单编号，后续可用于物流查询。</p>
          <div class="order-code">${order.id}</div>
          <div class="stat-grid" style="margin-top:18px;text-align:left">
            <div class="stat"><span class="muted">预计费用</span><strong>${formatMoney(order.total)}</strong></div>
            <div class="stat"><span class="muted">预计时效</span><strong>${order.eta}</strong></div>
            <div class="stat"><span class="muted">承运服务</span><strong>${order.service.name}</strong></div>
            <div class="stat"><span class="muted">推荐线路</span><strong>${order.channel}</strong></div>
            <div class="stat"><span class="muted">付款状态</span><strong>${order.paymentStatus}</strong></div>
            <div class="stat"><span class="muted">订单状态</span><strong>${order.status}</strong></div>
          </div>
          <p class="muted">下一步：请按打包指南准备包裹，等待后续取件或交寄安排。</p>
          <div class="hero-actions" style="justify-content:center">
            <a class="btn" href="#/tracking?order=${order.id}">查询物流</a>
            <a class="btn secondary" href="#/ship">再寄一票</a>
            <a class="btn ghost" href="#/account">查看用户中心</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTrackingPage(defaultOrderId = "") {
  const value = defaultOrderId || getLastOrderId();
  const result = pageState.trackingResult || (value ? findTracking(value) : null);
  return `
    ${renderPageHead("物流查询", "输入订单号或运单号，查看模拟物流状态和时间轴。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3 style="margin-top:0">查询提示</h3>
          <p>刚创建的模拟订单会保存在本机浏览器，可直接查询。任意编号也会返回一组演示状态。</p>
        </aside>
        <div>
          <div class="card">
            <form id="tracking-form" novalidate>
              <div class="form-grid">
                <div class="field">
                  <label>订单号 / 运单号 *</label>
                  <input name="trackingNo" value="${escapeHtml(value)}" placeholder="例如 KD20260101000123" required>
                </div>
                <div class="field" style="align-self:end">
                  <button class="btn orange full" type="submit">查询物流</button>
                </div>
              </div>
            </form>
          </div>
          <div id="tracking-result">${result ? renderTrackingResult(result) : ""}</div>
        </div>
      </div>
    </section>
  `;
}

function renderTrackingResult(result) {
  return `
    <div class="card" style="margin-top:18px">
      <div class="result-main">
        <div>
          <span class="muted">当前状态</span>
          <h2 style="margin:4px 0;color:var(--navy)">${result.currentStatus}</h2>
          <p class="muted">订单号：${escapeHtml(result.orderId)} ｜ ${result.origin} → ${result.destination} ｜ ${result.currentLocation}</p>
        </div>
        <div class="price" style="font-size:24px">${result.eta}</div>
      </div>
      <div class="progress-wrap">
        <div class="progress-meta"><span>运输进度</span><strong>${result.progress || 0}%</strong></div>
        <div class="progress-track"><span style="width:${result.progress || 0}%"></span></div>
      </div>
      <div class="stat-grid" style="margin:16px 0">
        <div class="stat"><span class="muted">承运服务</span><strong>${result.service}</strong></div>
        <div class="stat"><span class="muted">起运地</span><strong>${result.origin}</strong></div>
        <div class="stat"><span class="muted">目的地</span><strong>${result.destination}</strong></div>
        <div class="stat"><span class="muted">运输渠道</span><strong>${result.channel}</strong></div>
        <div class="stat"><span class="muted">付款状态</span><strong>${result.paymentStatus}</strong></div>
        <div class="stat"><span class="muted">预计送达</span><strong>${result.eta}</strong></div>
      </div>
      <div class="timeline">
        ${result.timeline.map((item) => `
          <div class="timeline-item ${item.done ? "done" : ""} ${item.status === result.currentStatus ? "current" : ""}">
            <span class="dot">${item.done ? "✓" : ""}</span>
            <div>
              <p class="timeline-title">${item.status}</p>
              <span class="muted">${formatDate(item.time)} · ${item.location || "处理中"}</span>
              <small>${item.detail || "状态已更新。"}</small>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderPackagingPage() {
  return `
    ${renderPageHead("打包指南", "寄件前把包装做好，可以明显降低破损、延误和退件风险。")}
    <section class="section tight">
      <div class="container">
        <div class="section-head compact">
          <div>
            <h2>按物品场景打包</h2>
            <p>不同货物的包装重点不同，先按场景确认，再看通用操作清单。</p>
          </div>
        </div>
        <div class="grid three">
          ${packagingScenarios.map(([title, text]) => `
            <div class="card scenario-card">
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
        <div class="section-head compact spaced">
          <div>
            <h2>通用打包清单</h2>
            <p>适合大多数国际快递包裹的基础要求。</p>
          </div>
        </div>
        <div class="grid two">
          ${packagingTips.map(([title, text], index) => `
            <div class="card">
              <span class="icon-tile">${index + 1}</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProhibitedPage() {
  return `
    ${renderPageHead("禁寄品说明", "不同国家和承运渠道限制不同，以下为常见禁寄或限制类型。")}
    <section class="section tight">
      <div class="container">
        <div class="grid three">
          ${prohibitedCategories.map(([title, text]) => `
            <div class="card warning-card">
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
        <div class="section-head compact spaced">
          <div>
            <h2>常见禁寄或限制物品</h2>
            <p>以下不是完整法律清单，只作为下单前自查提示。</p>
          </div>
        </div>
        <div class="grid three">
          ${prohibitedItems.map((item, index) => `
            <div class="card">
              <span class="icon-tile">${index + 1}</span>
              <h3>${item}</h3>
              <p>寄送前请确认目的国家法规和渠道要求，必要时联系客服核实。</p>
            </div>
          `).join("")}
        </div>
        <div class="notice" style="margin-top:18px">具体能否寄送以承运渠道和目的国家法规为准，下单前请联系客服确认。</div>
      </div>
    </section>
  `;
}

function renderHelpPage() {
  return `
    ${renderPageHead("常见问题", "把寄件前最容易卡住的问题放在这里，后续可以扩展为完整帮助中心。")}
    <section class="section tight">
      <div class="container">
        <div class="card">
          <div class="help-tools">
            <div class="field">
              <label>搜索问题</label>
              <input id="faq-search" placeholder="输入价格、地址、带电、清关、物流等关键词">
            </div>
            <div class="tag-list">
              ${helpCategories.map((item) => `<button class="tag-button" type="button" data-faq-keyword="${item.keywords[0]}">${item.name}</button>`).join("")}
            </div>
          </div>
          <div id="faq-list">
          ${faqs.map(([question, answer], index) => `
            <div class="faq-item ${index === 0 ? "open" : ""}">
              <button class="faq-button" type="button" data-faq-toggle>
                <span>${question}</span><span>+</span>
              </button>
              <div class="faq-answer">${answer}</div>
            </div>
          `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContactPage() {
  return `
    ${renderPageHead("联系我们", "当前为占位联系方式和前端留言表单，后续可接入工单或客服系统。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3>联系方式</h3>
          <p><strong>公司名称：</strong>公司名称占位</p>
          <p><strong>联系电话：</strong>联系电话占位</p>
          <p><strong>WhatsApp：</strong>WhatsApp 占位</p>
          <p><strong>微信号：</strong>微信号占位</p>
          <p><strong>邮箱：</strong>邮箱占位</p>
          <p><strong>工作时间：</strong>周一至周五 09:00-18:00</p>
          <div class="mini-list">
            <span>价格咨询：目的地、重量、尺寸、物品类型</span>
            <span>下单协助：地址、清关资料、包装建议</span>
            <span>异常处理：物流延误、清关补件、售后跟进</span>
          </div>
        </aside>
        <div class="card">
          <h2 style="margin-top:0">在线留言</h2>
          <form id="contact-form" novalidate>
            <div class="form-grid">
              ${input("name", "姓名", "", true)}
              ${input("phone", "电话", "", true)}
              ${input("email", "邮箱", "", false, "email")}
              <div class="field">
                <label>咨询类型 *</label>
                <select name="type" required>
                  <option value="">请选择</option>
                  <option>价格咨询</option>
                  <option>下单协助</option>
                  <option>物流查询</option>
                  <option>禁寄品确认</option>
                  <option>清关资料</option>
                  <option>商务合作</option>
                  <option>其他</option>
                </select>
              </div>
              <div class="field full">
                <label>留言内容 *</label>
                <textarea name="message" required></textarea>
              </div>
            </div>
            <div class="form-actions">
              <span class="muted" id="contact-note">当前不会真实提交。</span>
              <button class="btn orange" type="submit">提交留言</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderAccountPage() {
  const orders = getOrders();
  const contacts = getContacts();
  const stats = getOrderStats();
  return `
    ${renderPageHead("用户中心", "当前为前端演示版：显示本机浏览器保存的订单、联系人和常用操作。")}
    <section class="section tight">
      <div class="container">
        <div class="stat-grid">
          <div class="stat"><span class="muted">本地订单</span><strong>${stats.totalOrders}</strong></div>
          <div class="stat"><span class="muted">进行中</span><strong>${stats.active}</strong></div>
          <div class="stat"><span class="muted">需确认</span><strong>${stats.risk}</strong></div>
        </div>
        <div class="dashboard-layout">
          <div class="card">
            <div class="section-head compact">
              <div>
                <h2>最近订单</h2>
                <p>订单保存在当前浏览器 localStorage，换设备不会同步。</p>
              </div>
              <a class="btn orange" href="#/ship">新建订单</a>
            </div>
            ${orders.length ? `
              <div class="order-table">
                <div class="order-row head"><span>订单号</span><span>线路</span><span>费用</span><span>状态</span><span>操作</span></div>
                ${orders.slice(0, 8).map((order) => `
                  <div class="order-row">
                    <span>${order.id}</span>
                    <span>${order.sender.country} → ${order.recipient.country}</span>
                    <span>${formatMoney(order.total)}</span>
                    <span>${order.status}</span>
                    <a href="#/tracking?order=${order.id}">查询</a>
                  </div>
                `).join("")}
              </div>
            ` : `
              <div class="empty-state">
                <h3>还没有订单</h3>
                <p>创建一票模拟订单后，这里会显示订单记录、费用和查询入口。</p>
                <a class="btn" href="#/ship">创建第一票订单</a>
              </div>
            `}
          </div>
          <aside class="card side-panel-static">
            <h3>常用联系人</h3>
            ${contacts.length ? contacts.slice(0, 6).map((item) => `
              <div class="contact-item">
                <strong>${item.type}：${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.country)} · ${escapeHtml(item.city || "城市待填")}</span>
              </div>
            `).join("") : `<p class="muted">下单成功后，寄件人和收件人会自动进入本地联系人列表。</p>`}
            <div class="notice">正式用户中心后续可接登录、地址簿、发票抬头、包裹模板和付款记录。</div>
          </aside>
        </div>
      </div>
    </section>
  `;
}

function renderAdminPage() {
  const orders = getOrders();
  const stats = getOrderStats();
  const revenue = formatMoney(stats.revenue);
  return `
    ${renderPageHead("管理后台", "当前只做前端运营看板占位，不包含真实登录、权限、数据库或后台接口。")}
    <section class="section tight">
      <div class="container">
        <div class="ops-grid">
          <div class="ops-card"><span>订单总数</span><strong>${stats.totalOrders}</strong><small>本地模拟数据</small></div>
          <div class="ops-card"><span>进行中订单</span><strong>${stats.active}</strong><small>待支付、待取件、运输中</small></div>
          <div class="ops-card"><span>风险订单</span><strong>${stats.risk}</strong><small>带电、液体、偏远或清关复杂</small></div>
          <div class="ops-card"><span>模拟营业额</span><strong>${revenue}</strong><small>仅用于前端展示</small></div>
        </div>
        <div class="dashboard-layout">
          <div class="card">
            <div class="section-head compact">
              <div>
                <h2>订单审核队列</h2>
                <p>后续后台可以在这里处理渠道分配、资料审核、异常件和客服备注。</p>
              </div>
            </div>
            <div class="order-table">
              <div class="order-row head"><span>订单</span><span>渠道</span><span>风险</span><span>付款</span><span>处理</span></div>
              ${(orders.length ? orders.slice(0, 8) : mockAdminRows()).map((order) => `
                <div class="order-row">
                  <span>${order.id}</span>
                  <span>${order.channel || "待分配"}</span>
                  <span>${order.quote?.riskLevel || order.risk || "中等"}</span>
                  <span>${order.paymentStatus || "待支付"}</span>
                  <a href="#/tracking?order=${order.id}">查看</a>
                </div>
              `).join("")}
            </div>
          </div>
          <aside class="card side-panel-static">
            <h3>模块预留</h3>
            <div class="mini-list">
              ${integrationRoadmap.map(([title, text]) => `<span><strong>${title}</strong><br>${text}</span>`).join("")}
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;
}

function renderPlaceholder(title, text) {
  return `
    ${renderPageHead(title, text)}
    <section class="section tight">
      <div class="container">
        <div class="placeholder-panel">
          <h2 style="margin:0;color:var(--navy)">${title}占位</h2>
          <p class="muted">${text}</p>
          <a class="btn" href="#/">返回首页</a>
        </div>
      </div>
    </section>
  `;
}

function renderNotFound() {
  return renderPlaceholder("页面未找到", "当前链接不存在，请返回首页或使用顶部导航。");
}

function bindPage(route) {
  document.querySelector("[data-menu-toggle]")?.addEventListener("click", () => {
    document.querySelector("#site-header")?.classList.toggle("menu-open");
  });

  document.querySelectorAll("[data-faq-toggle]").forEach((button) => {
    button.addEventListener("click", () => button.closest(".faq-item")?.classList.toggle("open"));
  });
  document.querySelector("#faq-search")?.addEventListener("input", handleFaqSearch);
  document.querySelectorAll("[data-faq-keyword]").forEach((button) => {
    button.addEventListener("click", () => {
      const search = document.querySelector("#faq-search");
      search.value = button.dataset.faqKeyword || "";
      handleFaqSearch({ currentTarget: search });
    });
  });

  document.querySelectorAll(".quote-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(form)) return;
      const result = calculateQuote(collectQuoteInput(form));
      pageState.quoteResult = result;
      const target = form.id === "home-quote-form" ? "#home-quote-result" : "#quote-result";
      document.querySelector(target).innerHTML = renderQuoteResult(result);
    });
  });

  document.querySelector("#shipment-step-form")?.addEventListener("submit", handleShipmentSubmit);
  document.querySelector("#tracking-form")?.addEventListener("submit", handleTrackingSubmit);
  document.querySelector("#contact-form")?.addEventListener("submit", handleContactSubmit);
}

function handleShipmentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const step = Number(form.dataset.step);
  const draft = getDraft();
  const data = new FormData(form);

  if (step === 1) draft.type = data.get("type") || "包裹";
  if (step === 2) draft.sender = collectAddress(data);
  if (step === 3) draft.recipient = collectAddress(data);
  if (step === 4) draft.parcel = collectParcel(data);
  if (step === 5) {
    const next = collectCustomsPickup(data);
    draft.customs = next.customs;
    draft.pickup = next.pickup;
  }
  if (step === 6) draft.serviceId = data.get("serviceId") || "standard";
  if (step === 7) {
    draft.accepted = data.get("accepted") === "on";
    saveDraft(draft);
    const order = createOrder(draft);
    window.location.hash = `#/success?order=${order.id}`;
    return;
  }

  saveDraft(draft);
  window.location.hash = `#/ship?step=${step + 1}`;
}

function handleTrackingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const result = findTracking(new FormData(form).get("trackingNo"));
  pageState.trackingResult = result;
  document.querySelector("#tracking-result").innerHTML = renderTrackingResult(result);
}

function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  form.reset();
  document.querySelector("#contact-note").textContent = "留言已在前端模拟提交，后续可接入真实接口。";
}

function handleFaqSearch(event) {
  const keyword = String(event.currentTarget.value || "").trim().toLowerCase();
  document.querySelectorAll("#faq-list .faq-item").forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.hidden = Boolean(keyword) && !text.includes(keyword);
  });
}

function collectQuoteInput(form) {
  const data = new FormData(form);
  return {
    origin: data.get("origin"),
    destination: data.get("destination"),
    weight: data.get("weight"),
    length: data.get("length"),
    width: data.get("width"),
    height: data.get("height"),
    cargoType: data.get("cargoType"),
    declaredValue: data.get("declaredValue"),
    isDocument: data.get("isDocument") === "on",
    hasBattery: data.get("hasBattery") === "on",
    hasLiquid: data.get("hasLiquid") === "on",
    needInsurance: data.get("needInsurance") === "on",
    needPickup: data.get("needPickup") === "on",
    isRemoteArea: data.get("isRemoteArea") === "on",
    isResidential: data.get("isResidential") === "on",
    needClearanceSupport: data.get("needClearanceSupport") === "on"
  };
}

function collectAddress(data) {
  return {
    name: value(data, "name"),
    company: value(data, "company"),
    phone: value(data, "phone"),
    email: value(data, "email"),
    country: value(data, "country"),
    taxId: value(data, "taxId"),
    province: value(data, "province"),
    city: value(data, "city"),
    address: value(data, "address"),
    postalCode: value(data, "postalCode"),
    addressType: value(data, "addressType") || "商业",
    isRemoteArea: data.get("isRemoteArea") === "on"
  };
}

function collectParcel(data) {
  return {
    count: value(data, "count"),
    weight: value(data, "weight"),
    length: value(data, "length"),
    width: value(data, "width"),
    height: value(data, "height"),
    itemName: value(data, "itemName"),
    declaredValue: value(data, "declaredValue"),
    currency: value(data, "currency"),
    hasBattery: data.get("hasBattery") === "on",
    hasLiquid: data.get("hasLiquid") === "on",
    hasPowder: data.get("hasPowder") === "on",
    isBranded: data.get("isBranded") === "on",
    needInsurance: data.get("needInsurance") === "on"
  };
}

function collectCustomsPickup(data) {
  const remark = value(data, "remark");
  return {
    customs: {
      purpose: value(data, "purpose"),
      hsCode: value(data, "hsCode"),
      invoiceType: value(data, "invoiceType"),
      needSupport: data.get("needSupport") === "on",
      remark
    },
    pickup: {
      enabled: data.get("pickupEnabled") === "on",
      date: value(data, "pickupDate"),
      window: value(data, "pickupWindow") || "09:00-12:00",
      contactNote: remark
    }
  };
}

function validateForm(form) {
  const invalid = [...form.querySelectorAll("[required]")].filter((field) => {
    if (field.type === "checkbox") return !field.checked;
    return !String(field.value || "").trim();
  });
  form.querySelector(".error-list")?.remove();
  if (!form.checkValidity() || invalid.length) {
    form.insertAdjacentHTML("beforeend", `<div class="error-list">请先填写所有必填项，并检查邮箱、数字等格式。</div>`);
    form.reportValidity?.();
    return false;
  }
  return true;
}

function input(name, label, valueText = "", required = false, type = "text", min = "") {
  return `
    <div class="field">
      <label>${label}${required ? " *" : ""}</label>
      <input name="${name}" type="${type}" value="${escapeHtml(valueText)}" ${required ? "required" : ""} ${min ? `min="${min}" step="${type === "number" ? min : ""}"` : ""}>
    </div>
  `;
}

function parcelCheck(name, label, checked) {
  return `<label class="chip-check"><input name="${name}" type="checkbox" ${checked ? "checked" : ""}> ${label}</label>`;
}

function summaryCard(title, data) {
  return `
    <div class="card" style="box-shadow:none">
      <h3>${title}</h3>
      <div class="summary-list">
        <div class="summary-row"><span>姓名</span><strong>${escapeHtml(data.name || "未填写")}</strong></div>
        <div class="summary-row"><span>公司</span><strong>${escapeHtml(data.company || "未填写")}</strong></div>
        <div class="summary-row"><span>电话</span><strong>${escapeHtml(data.phone || "未填写")}</strong></div>
        <div class="summary-row"><span>邮箱</span><strong>${escapeHtml(data.email || "未填写")}</strong></div>
        <div class="summary-row"><span>地区</span><strong>${escapeHtml([data.country, data.province, data.city].filter(Boolean).join(" / ") || "未填写")}</strong></div>
        <div class="summary-row"><span>地址类型</span><strong>${escapeHtml(data.addressType || "商业")}${data.isRemoteArea ? " / 偏远地区" : ""}</strong></div>
        <div class="summary-row"><span>地址</span><strong>${escapeHtml(data.address || "未填写")}</strong></div>
      </div>
    </div>
  `;
}

function renderPageHead(title, text) {
  return `
    <section class="page-head">
      <div class="container">
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
    </section>
  `;
}

function flowText(step) {
  const map = {
    查询价格: "先确认目的地、重量、尺寸和特殊属性。",
    填写资料: "录入寄件人、收件人和清关所需信息。",
    打包包裹: "按物品类型做好防护和外箱封装。",
    提交订单: "确认费用、时效和注意事项后提交。",
    安排取件: "后续可对接预约取件或网点交寄。",
    查看物流: "用订单号追踪包裹状态和预计送达。"
  };
  return map[step] || "";
}

function mockAdminRows() {
  return [
    { id: "KD-DEMO-1001", channel: "北美商务线", risk: "中等", paymentStatus: "待支付" },
    { id: "KD-DEMO-1002", channel: "欧洲清关线", risk: "需人工确认", paymentStatus: "待确认" },
    { id: "KD-DEMO-1003", channel: "区域优先线", risk: "较低", paymentStatus: "已确认" }
  ];
}

function isActive(activePath, href) {
  if (href === "/") return activePath === "/" || activePath === "/home";
  return activePath.startsWith(href);
}

function value(data, key) {
  return String(data.get(key) || "").trim();
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function escapeHtml(valueText) {
  return String(valueText ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
