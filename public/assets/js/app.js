import {
  advantages,
  cargoTypes,
  countries,
  currencies,
  faqs,
  flowSteps,
  packagingTips,
  prohibitedItems,
  quickActions,
  services,
  shipmentTypes
} from "./data.js";
import { calculateQuote, formatMoney } from "./quote.js";
import { createOrder, defaultDraft, getDraft, getLastOrderId, getOrder, saveDraft } from "./order.js";
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
  if (path === "/confirm") return renderShipmentPage(6);
  if (path === "/success") return renderSuccessPage(route.params.get("order") || getLastOrderId());
  if (path === "/tracking") return renderTrackingPage(route.params.get("order") || "");
  if (path === "/packaging") return renderPackagingPage();
  if (path === "/prohibited") return renderProhibitedPage();
  if (path === "/help") return renderHelpPage();
  if (path === "/contact") return renderContactPage();
  if (path === "/account") return renderPlaceholder("用户中心", "后续可接入账号登录、地址簿、订单记录、常用包裹模板和发票资料。");
  if (path === "/admin") return renderPlaceholder("管理后台", "当前仅保留入口。后续可扩展订单审核、渠道报价、客户管理、物流 API 对接和财务报表。");
  return renderNotFound();
}

function renderHeader(activePath) {
  const links = [
    ["/", "首页"],
    ["/ship", "寄件"],
    ["/quote", "查询价格"],
    ["/tracking", "物流查询"],
    ["/packaging", "打包指南"],
    ["/help", "帮助中心"]
  ];
  return `
    <header class="header" id="site-header">
      <div class="container nav">
        <a class="brand" href="#/">
          <span class="brand-mark">快</span>
          <span>快递</span>
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
      </div>
      <div class="container footer-bottom">© ${new Date().getFullYear()} 快递自助寄件平台。当前为前端演示版本，费用与时效为模拟数据。</div>
    </footer>
  `;
}

function renderHome() {
  return `
    <section class="hero">
      <div class="container hero-inner">
        <div>
          <span class="eyebrow">快递国际</span>
          <h1>国际快递，自助下单，轻松寄全球</h1>
          <p>在线查询价格、创建订单、预约取件、追踪物流进度。先用清晰流程把寄件这件事变简单。</p>
          <div class="hero-actions">
            <a class="btn orange" href="#/ship">立即寄件</a>
            <a class="btn secondary" href="#/tracking">查询物流</a>
          </div>
        </div>
        <div class="hero-panel">
          <div class="quick-quote">
            <h2 style="margin:0 0 12px;color:var(--navy);font-size:22px">快速估算</h2>
            ${renderQuoteForm("home-quote-form", true)}
            <div id="home-quote-result"></div>
          </div>
        </div>
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
  `;
}

function renderQuotePage() {
  return `
    ${renderPageHead("在线报价", "输入包裹重量、尺寸和货物属性，获取模拟费用、计费重量和预计时效。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3 style="margin-top:0">计费说明</h3>
          <p>体积重 = 长 × 宽 × 高 ÷ 5000。计费重量取实际重量和体积重较大值。</p>
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
      </div>
      <div>
        <strong>费用明细</strong>
        <p class="muted">基础运费 ${formatMoney(result.baseFee)}${result.surcharges.length ? "，" + result.surcharges.map((item) => `${item.label} ${formatMoney(item.amount)}`).join("，") : "，无附加费"}。</p>
      </div>
      <ul class="muted">
        ${result.notes.map((note) => `<li>${note}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderShipmentPage(step) {
  const safeStep = Math.min(6, Math.max(1, step || 1));
  const draft = getDraft();
  return `
    ${renderPageHead("创建寄件订单", "按步骤填写资料并生成模拟订单号。当前不接真实支付、取件或物流 API。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <div class="step-list">
            ${["寄件类型", "寄件人信息", "收件人信息", "包裹信息", "选择服务", "订单确认"].map((label, index) => `
              <a class="step-item ${safeStep === index + 1 ? "active" : ""}" href="#/ship?step=${index + 1}">
                <span class="step-number">${index + 1}</span>
                <span>${label}</span>
              </a>
            `).join("")}
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
  if (step === 5) return renderServiceStep(draft);
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
        ${input("phone", "电话", data.phone, true)}
        ${input("email", "邮箱", data.email, true, "email")}
        <div class="field">
          <label>国家/地区 *</label>
          <select name="country" required>${countryOptions}</select>
        </div>
        ${input("province", "省/州", data.province, true)}
        ${input("city", "城市", data.city, true)}
        ${input("postalCode", "邮编", data.postalCode, true)}
        <div class="field full">
          <label>地址 *</label>
          <textarea name="address" required>${escapeHtml(data.address)}</textarea>
        </div>
      </div>
      ${renderStepActions(kind === "sender" ? 2 : 3)}
    </form>
  `;
}

function renderParcelStep(parcel) {
  const currencyOptions = currencies.map((item) => `<option value="${item}" ${parcel.currency === item ? "selected" : ""}>${item}</option>`).join("");
  return `
    <h2>第 4 步：填写包裹信息</h2>
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
    needPickup: true
  });
  return `
    <h2>第 5 步：选择服务</h2>
    <form id="shipment-step-form" data-step="5" novalidate>
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
    needPickup: true
  });
  const service = services.find((item) => item.id === draft.serviceId) || services[0];
  const total = quote.total * service.factor;
  return `
    <h2>第 6 步：订单确认</h2>
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
        <div class="summary-row"><span>计费重量</span><strong>${quote.chargeableWeight} kg</strong></div>
        <div class="summary-row"><span>预计费用</span><strong>${formatMoney(total)}</strong></div>
      </div>
    </div>
    <form id="shipment-step-form" data-step="6" novalidate>
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
          </div>
          <p class="muted">下一步：请按打包指南准备包裹，等待后续取件或交寄安排。</p>
          <div class="hero-actions" style="justify-content:center">
            <a class="btn" href="#/tracking?order=${order.id}">查询物流</a>
            <a class="btn secondary" href="#/ship">再寄一票</a>
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
          <p class="muted">订单号：${escapeHtml(result.orderId)} ｜ ${result.origin} → ${result.destination}</p>
        </div>
        <div class="price" style="font-size:24px">${result.eta}</div>
      </div>
      <div class="stat-grid" style="margin:16px 0">
        <div class="stat"><span class="muted">承运服务</span><strong>${result.service}</strong></div>
        <div class="stat"><span class="muted">起运地</span><strong>${result.origin}</strong></div>
        <div class="stat"><span class="muted">目的地</span><strong>${result.destination}</strong></div>
      </div>
      <div class="timeline">
        ${result.timeline.map((item) => `
          <div class="timeline-item ${item.done ? "done" : ""} ${item.status === result.currentStatus ? "current" : ""}">
            <span class="dot">${item.done ? "✓" : ""}</span>
            <div>
              <p class="timeline-title">${item.status}</p>
              <span class="muted">${formatDate(item.time)}</span>
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
    </section>
  `;
}

function renderContactPage() {
  return `
    ${renderPageHead("联系我们", "当前为占位联系方式和前端留言表单，后续可接入工单或客服系统。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3 style="margin-top:0">联系方式</h3>
          <p><strong>公司名称：</strong>公司名称占位</p>
          <p><strong>联系电话：</strong>联系电话占位</p>
          <p><strong>WhatsApp：</strong>WhatsApp 占位</p>
          <p><strong>微信号：</strong>微信号占位</p>
          <p><strong>邮箱：</strong>邮箱占位</p>
          <p><strong>工作时间：</strong>周一至周五 09:00-18:00</p>
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
  if (step === 5) draft.serviceId = data.get("serviceId") || "standard";
  if (step === 6) {
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
    needPickup: data.get("needPickup") === "on"
  };
}

function collectAddress(data) {
  return {
    name: value(data, "name"),
    phone: value(data, "phone"),
    email: value(data, "email"),
    country: value(data, "country"),
    province: value(data, "province"),
    city: value(data, "city"),
    address: value(data, "address"),
    postalCode: value(data, "postalCode")
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
        <div class="summary-row"><span>电话</span><strong>${escapeHtml(data.phone || "未填写")}</strong></div>
        <div class="summary-row"><span>邮箱</span><strong>${escapeHtml(data.email || "未填写")}</strong></div>
        <div class="summary-row"><span>地区</span><strong>${escapeHtml([data.country, data.province, data.city].filter(Boolean).join(" / ") || "未填写")}</strong></div>
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
