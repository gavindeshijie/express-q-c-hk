import {
  advantages,
  cargoTypes,
  countries,
  currencies,
  apiModules,
  automationRules,
  controlTowerMetrics,
  documentChecklist,
  documentTemplates,
  faqs,
  featureGapFindings,
  flowSteps,
  helpCategories,
  integrationRoadmap,
  notificationChannels,
  packagingScenarios,
  packagingTips,
  pickupWindows,
  prohibitedItems,
  prohibitedCategories,
  quickActions,
  returnReasons,
  riskRules,
  routeHighlights,
  serviceMatrix,
  services,
  shipmentTypes
} from "./data.js";
import { calculateQuote, estimateDuty, formatMoney, lookupHsCode, scoreAddress } from "./quote.js";
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
  const isGateway = route.path === "/" || route.path === "/home";
  app.innerHTML = `
    <div class="site-shell ${isGateway ? "gateway-shell" : ""}">
      ${isGateway ? "" : renderHeader(route.path)}
      <main class="main">${content}</main>
      ${isGateway ? "" : renderFooter()}
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
  if (path === "/" || path === "/home") return renderLanguageGateway();
  if (path === "/quote") return renderQuotePage();
  if (path === "/ship") return renderShipmentPage(Number(route.params.get("step") || 1));
  if (path === "/sender") return renderShipmentPage(2);
  if (path === "/recipient") return renderShipmentPage(3);
  if (path === "/parcel") return renderShipmentPage(4);
  if (path === "/confirm") return renderShipmentPage(7);
  if (path === "/success") return renderSuccessPage(route.params.get("order") || getLastOrderId());
  if (path === "/tracking") return renderTrackingPage(route.params.get("order") || "");
  if (path === "/tools") return renderToolsPage();
  if (path === "/documents") return renderDocumentsPage();
  if (path === "/returns") return renderReturnsPage();
  if (path === "/integrations") return renderIntegrationsPage();
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
    ["/tools", "智能工具"],
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
          <a href="#/tools">智能工具</a>
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
          <a href="#/documents">单据中心</a>
          <a href="#/returns">退件管理</a>
          <a href="#/admin">运营看板</a>
          <a href="#/integrations">接口集成</a>
        </div>
      </div>
      <div class="container footer-bottom">© ${new Date().getFullYear()} 快递自助寄件平台。当前为前端演示版本，费用与时效为模拟数据。</div>
    </footer>
  `;
}

function renderLanguageGateway() {
  const languageCards = [
    {
      lang: "中文",
      price: "中国地区价格",
      symbol: "¥",
      flag: "/assets/images/language/flag-cn.png",
      href: "#/quote?market=cn&lang=zh-CN",
      code: "CN"
    },
    {
      lang: "English",
      price: "Price for Singapore",
      symbol: "S$",
      flag: "/assets/images/language/flag-sg.png",
      href: "#/quote?market=sg&lang=en",
      code: "SG"
    },
    {
      lang: "ภาษาไทย",
      price: "ราคาในประเทศไทย",
      symbol: "฿",
      flag: "/assets/images/language/flag-th.png",
      href: "#/quote?market=th&lang=th",
      code: "TH"
    },
    {
      lang: "Tiếng Việt",
      price: "Giá tại Việt Nam",
      symbol: "₫",
      flag: "/assets/images/language/flag-vn.png",
      href: "#/quote?market=vn&lang=vi",
      code: "VN"
    },
    {
      lang: "Bahasa Melayu",
      price: "Harga di Malaysia",
      symbol: "RM",
      flag: "/assets/images/language/flag-my.png",
      href: "#/quote?market=my&lang=ms",
      code: "MY"
    },
    {
      lang: "ພາສາລາວ",
      price: "ລາຄາໃນລາວ",
      symbol: "K",
      flag: "/assets/images/language/flag-la.png",
      href: "#/quote?market=la&lang=lo",
      code: "LA"
    }
  ];
  const features = [
    ["安全可靠", "SAFE & SECURE", "/assets/images/language/icon-secure.png"],
    ["快速访问", "FAST ACCESS", "/assets/images/language/icon-fast.png"],
    ["多语言支持", "MULTI-LANGUAGE SUPPORT", "/assets/images/language/icon-language.png"],
    ["优质服务", "PREMIUM SERVICE", "/assets/images/language/icon-premium.png"]
  ];
  return `
    <section class="language-gateway" aria-label="语言选择入口">
      <div class="language-orbit"></div>
      <div class="language-stage">
        <header class="language-welcome">
          <p>秘语贸易欢迎您</p>
          <h1>Welcome to Secret Language Trade</h1>
          <p>ยินดีต้อนรับสู่การค้าภาษาลับ</p>
          <p>Chào mừng bạn đến với Thương mại Ngôn ngữ Bí mật</p>
        </header>
        <div class="language-grid">
          ${languageCards.map((card) => `
            <a class="language-card" href="${card.href}" data-language-card="${card.code}" aria-label="${card.lang} ${card.price}">
              <span class="card-corner top-left"></span>
              <span class="card-corner top-right"></span>
              <span class="card-corner bottom-left"></span>
              <span class="card-corner bottom-right"></span>
              <span class="language-code">${card.code}</span>
              <img class="language-flag" src="${card.flag}" alt="${card.lang}">
              <span class="language-name">${card.lang}</span>
              <span class="language-price"><b>${card.symbol}</b><span>${card.price}</span></span>
            </a>
          `).join("")}
        </div>
        <footer class="language-features">
          ${features.map(([title, sub, icon]) => `
            <a class="language-feature" href="#/tools">
              <img src="${icon}" alt="">
              <span><b>${title}</b><small>${sub}</small></span>
            </a>
          `).join("")}
        </footer>
      </div>
    </section>
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
      <div class="container intelligence-grid">
        <div class="ai-panel">
          <span class="eyebrow">AI Shipping Desk</span>
          <h2>智能寄件工作台</h2>
          <p>先把国际快递常见判断做成前端模拟：地址质量、品类风险、税费预估、清关资料、通知订阅和退件流程。后续接真实 API 时，这里就是业务入口。</p>
          <div class="ai-actions">
            <a class="btn orange" href="#/tools">打开智能工具</a>
            <a class="btn secondary" href="#/integrations">查看接口规划</a>
          </div>
        </div>
        <div class="gap-board">
          ${featureGapFindings.slice(0, 6).map(([title, text, status]) => `
            <div class="gap-item">
              <strong>${title}</strong>
              <span>${text}</span>
              <small>${status}</small>
            </div>
          `).join("")}
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
          <div class="side-actions">
            <a class="btn full" href="#/tools">税费与 HS Code</a>
            <a class="btn secondary full" href="#/documents">查看单据中心</a>
          </div>
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

function renderToolsPage() {
  return `
    ${renderPageHead("智能工具台", "集中处理国际寄件前最容易漏掉的判断：地址质量、HS Code、税费预估、通知偏好和智能建议。")}
    <section class="section tight">
      <div class="container tool-layout">
        <aside class="card side-panel">
          <h3>这一轮补齐的能力</h3>
          <div class="mini-list">
            ${featureGapFindings.map(([title, text, status]) => `<span><strong>${title}</strong><br>${text}<br><em>${status}</em></span>`).join("")}
          </div>
        </aside>
        <div class="tool-stack">
          <div class="card tool-card prominent-tool">
            <div>
              <span class="panel-kicker">AI Advisor</span>
              <h2>寄件建议生成器</h2>
              <p>输入目的地、货物属性和价值，生成一组模拟建议：服务选择、风险点、清关资料和操作提醒。</p>
            </div>
            <form id="advisor-form" class="tool-form" novalidate>
              <div class="form-grid three">
                <div class="field">
                  <label>目的国家/地区 *</label>
                  <select name="destination" required>${countryOptions("美国")}</select>
                </div>
                <div class="field">
                  <label>重量 kg *</label>
                  <input name="weight" type="number" value="1.5" min="0.1" step="0.1" required>
                </div>
                <div class="field">
                  <label>申报价值 CNY *</label>
                  <input name="declaredValue" type="number" value="600" min="1" step="1" required>
                </div>
              </div>
              <div class="check-row" style="margin-top:12px">
                <label class="chip-check"><input name="hasBattery" type="checkbox"> 带电</label>
                <label class="chip-check"><input name="hasLiquid" type="checkbox"> 液体</label>
                <label class="chip-check"><input name="isRemoteArea" type="checkbox"> 偏远地区</label>
                <label class="chip-check"><input name="needInsurance" type="checkbox"> 需要保险</label>
              </div>
              <div class="form-actions">
                <span class="muted">模拟建议，不替代真实渠道审核。</span>
                <button class="btn orange" type="submit">生成建议</button>
              </div>
            </form>
            <div id="advisor-result">${renderAdvisorResult({ destination: "美国", weight: 1.5, declaredValue: 600 })}</div>
          </div>
          <div class="grid two">
            <div class="card tool-card">
              <h2>税费 / 关税预估</h2>
              <form id="duty-form" novalidate>
                <div class="form-grid">
                  <div class="field">
                    <label>目的国家/地区 *</label>
                    <select name="destination" required>${countryOptions("美国")}</select>
                  </div>
                  <div class="field">
                    <label>申报价值 CNY *</label>
                    <input name="declaredValue" type="number" value="800" min="1" step="1" required>
                  </div>
                  <div class="field">
                    <label>预计运费 CNY *</label>
                    <input name="freight" type="number" value="180" min="0" step="1" required>
                  </div>
                  <div class="field">
                    <label>贸易条款 *</label>
                    <select name="incoterm" required>
                      <option>DDU</option>
                      <option>DDP</option>
                    </select>
                  </div>
                </div>
                <div class="form-actions"><span></span><button class="btn" type="submit">估算税费</button></div>
              </form>
              <div id="duty-result">${renderDutyResult(estimateDuty({ destination: "美国", declaredValue: 800, freight: 180, incoterm: "DDU" }))}</div>
            </div>
            <div class="card tool-card">
              <h2>HS Code 辅助</h2>
              <form id="hs-form" novalidate>
                <div class="field">
                  <label>物品关键词 *</label>
                  <input name="keyword" value="服饰" placeholder="例如：服饰、电子配件、文件、玩具" required>
                </div>
                <div class="form-actions"><span class="muted">仅作前端样例查询。</span><button class="btn" type="submit">查询编码</button></div>
              </form>
              <div id="hs-result">${renderHsResult(lookupHsCode("服饰"))}</div>
            </div>
          </div>
          <div class="grid two">
            <div class="card tool-card">
              <h2>地址质量体检</h2>
              <form id="address-score-form" novalidate>
                <div class="form-grid">
                  ${input("name", "姓名", "Test Receiver", true)}
                  ${input("phone", "电话", "+1 202 000 0000", true)}
                  ${input("email", "邮箱", "receiver@example.com", true, "email")}
                  ${input("country", "国家/地区", "美国", true)}
                  ${input("city", "城市", "Los Angeles", true)}
                  ${input("postalCode", "邮编", "90001", true)}
                  ${input("taxId", "税号 / 识别号", "", false)}
                  <div class="field">
                    <label>地址类型 *</label>
                    <select name="addressType" required><option>商业</option><option>住宅</option></select>
                  </div>
                  <div class="field full">
                    <label>详细地址 *</label>
                    <textarea name="address" required>100 Test Ave</textarea>
                  </div>
                </div>
                <div class="form-actions"><span></span><button class="btn" type="submit">检查地址</button></div>
              </form>
              <div id="address-score-result">${renderAddressScore(scoreAddress({ name: "Test Receiver", phone: "+1 202 000 0000", email: "receiver@example.com", country: "美国", city: "Los Angeles", postalCode: "90001", address: "100 Test Ave", addressType: "商业" }))}</div>
            </div>
            <div class="card tool-card">
              <h2>通知偏好</h2>
              <p class="muted">当前只做前端展示，后续可以接邮件、短信、即时消息和客服系统。</p>
              <div class="notification-grid">
                ${notificationChannels.map(([title, text]) => `
                  <label class="notification-option">
                    <input type="checkbox" checked>
                    <span><strong>${title}</strong><small>${text}</small></span>
                  </label>
                `).join("")}
              </div>
              <div class="notice soft-notice">建议至少开启订单确认、清关补件、派送中和已签收四类通知。</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDocumentsPage() {
  const order = getOrder(getLastOrderId()) || getOrders()[0];
  return `
    ${renderPageHead("单据中心", "集中预览运单面单、商业发票、装箱单、保险声明和清关补件通知。")}
    <section class="section tight">
      <div class="container dashboard-layout">
        <div class="card">
          <div class="section-head compact">
            <div>
              <h2>单据模板</h2>
              <p>当前为前端模板预览，真实文件生成需后续接面单和清关接口。</p>
            </div>
          </div>
          <div class="grid two">
            ${documentTemplates.map(([title, text, status]) => `
              <div class="document-tile">
                <strong>${title}</strong>
                <span>${text}</span>
                <small>${status}</small>
              </div>
            `).join("")}
          </div>
        </div>
        <aside class="card side-panel-static">
          <h3>商业发票预览</h3>
          ${order ? renderInvoicePreview(order) : `
            <div class="empty-state">
              <h3>还没有订单</h3>
              <p>创建一票订单后，这里会用订单资料生成商业发票预览。</p>
              <a class="btn" href="#/ship">创建订单</a>
            </div>
          `}
        </aside>
      </div>
    </section>
  `;
}

function renderReturnsPage() {
  const orders = getOrders();
  return `
    ${renderPageHead("退件管理", "模拟退件申请、原因选择、处理状态和后续接逆向物流能力。")}
    <section class="section tight">
      <div class="container layout">
        <aside class="card side-panel">
          <h3>退件流程</h3>
          <div class="mini-list">
            <span>1. 输入订单号并选择退件原因</span>
            <span>2. 系统判断是否需要客服复核</span>
            <span>3. 生成退件说明或后续退件面单</span>
            <span>4. 后续接真实渠道后同步退件轨迹</span>
          </div>
        </aside>
        <div class="card">
          <h2>创建退件申请</h2>
          <form id="return-form" novalidate>
            <div class="form-grid">
              <div class="field">
                <label>订单号 *</label>
                <input name="orderId" value="${orders[0]?.id || ""}" placeholder="例如 KD20260625000123" required>
              </div>
              <div class="field">
                <label>退件原因 *</label>
                <select name="reason" required>${returnReasons.map((item) => `<option>${item}</option>`).join("")}</select>
              </div>
              <div class="field">
                <label>包裹状态 *</label>
                <select name="condition" required>
                  <option>未派送</option>
                  <option>已签收但需退回</option>
                  <option>清关退件</option>
                  <option>包裹异常</option>
                </select>
              </div>
              <div class="field">
                <label>联系人电话 *</label>
                <input name="phone" placeholder="+852 ..." required>
              </div>
              <div class="field full">
                <label>补充说明</label>
                <textarea name="message" placeholder="说明退件原因、是否需要重新派送或退回寄件地。"></textarea>
              </div>
            </div>
            <div class="form-actions">
              <span class="muted">当前不会真实提交。</span>
              <button class="btn orange" type="submit">生成退件申请</button>
            </div>
          </form>
          <div id="return-result"></div>
        </div>
      </div>
    </section>
  `;
}

function renderIntegrationsPage() {
  return `
    ${renderPageHead("接口集成", "把当前静态模拟能力拆成后续真实系统可以替换的接口模块。")}
    <section class="section tight">
      <div class="container">
        <div class="integration-hero">
          <div>
            <span class="eyebrow">API Ready</span>
            <h2>从静态演示到真实寄件系统</h2>
            <p>当前页面已经把报价、订单、轨迹、单据、支付、通知和客服工单拆成清晰模块。后续接真实服务时，优先替换 JS 工具层，再逐步接后端。</p>
          </div>
          <a class="btn orange" href="#/admin">查看运营看板</a>
        </div>
        <div class="grid three">
          ${apiModules.map(([title, text]) => `
            <div class="card">
              <span class="icon-tile">API</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
        <div class="section-head compact spaced">
          <div>
            <h2>自动化规则</h2>
            <p>把人工经验沉淀为前端提醒和后端规则，减少漏填、误寄和异常处理成本。</p>
          </div>
        </div>
        <div class="automation-board">
          ${automationRules.map(([title, text]) => `
            <div>
              <strong>${title}</strong>
              <span>${text}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
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
  document.querySelectorAll("[data-language-card]").forEach((card) => {
    card.addEventListener("click", () => {
      localStorage.setItem("kd_selected_market", card.dataset.languageCard || "");
    });
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
  document.querySelector("#advisor-form")?.addEventListener("submit", handleAdvisorSubmit);
  document.querySelector("#duty-form")?.addEventListener("submit", handleDutySubmit);
  document.querySelector("#hs-form")?.addEventListener("submit", handleHsSubmit);
  document.querySelector("#address-score-form")?.addEventListener("submit", handleAddressScoreSubmit);
  document.querySelector("#return-form")?.addEventListener("submit", handleReturnSubmit);
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

function handleAdvisorSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const data = new FormData(form);
  const input = {
    destination: value(data, "destination"),
    weight: value(data, "weight"),
    declaredValue: value(data, "declaredValue"),
    hasBattery: data.get("hasBattery") === "on",
    hasLiquid: data.get("hasLiquid") === "on",
    isRemoteArea: data.get("isRemoteArea") === "on",
    needInsurance: data.get("needInsurance") === "on"
  };
  document.querySelector("#advisor-result").innerHTML = renderAdvisorResult(input);
}

function handleDutySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const data = new FormData(form);
  const result = estimateDuty({
    destination: value(data, "destination"),
    declaredValue: value(data, "declaredValue"),
    freight: value(data, "freight"),
    incoterm: value(data, "incoterm")
  });
  document.querySelector("#duty-result").innerHTML = renderDutyResult(result);
}

function handleHsSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const data = new FormData(form);
  document.querySelector("#hs-result").innerHTML = renderHsResult(lookupHsCode(value(data, "keyword")));
}

function handleAddressScoreSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const data = new FormData(form);
  const result = scoreAddress({
    name: value(data, "name"),
    phone: value(data, "phone"),
    email: value(data, "email"),
    country: value(data, "country"),
    city: value(data, "city"),
    postalCode: value(data, "postalCode"),
    taxId: value(data, "taxId"),
    addressType: value(data, "addressType"),
    address: value(data, "address")
  });
  document.querySelector("#address-score-result").innerHTML = renderAddressScore(result);
}

function handleReturnSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const data = new FormData(form);
  const orderId = value(data, "orderId");
  const reason = value(data, "reason");
  const condition = value(data, "condition");
  const needsReview = ["清关资料不完整", "包裹破损", "包裹异常", "清关退件"].some((item) => `${reason} ${condition}`.includes(item));
  document.querySelector("#return-result").innerHTML = `
    <div class="result-box" style="margin-top:18px">
      <div class="result-main">
        <div>
          <strong>退件申请已模拟生成</strong>
          <div class="price" style="font-size:24px">${needsReview ? "需客服复核" : "可进入退件流程"}</div>
        </div>
        <a class="btn" href="#/tracking?order=${escapeHtml(orderId)}">查看原订单</a>
      </div>
      <div class="stat-grid">
        <div class="stat"><span class="muted">退件编号</span><strong>RT${Date.now().toString().slice(-8)}</strong></div>
        <div class="stat"><span class="muted">原订单</span><strong>${escapeHtml(orderId)}</strong></div>
        <div class="stat"><span class="muted">处理建议</span><strong>${needsReview ? "人工确认" : "自动受理"}</strong></div>
      </div>
      <p class="muted">当前不会真实提交。后续接入退件 API 后，可生成退件面单、同步退件轨迹和客服工单。</p>
    </div>
  `;
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

function renderAdvisorResult(input) {
  const quote = calculateQuote({
    origin: "中国香港",
    destination: input.destination,
    weight: input.weight,
    length: 28,
    width: 22,
    height: 16,
    declaredValue: input.declaredValue,
    hasBattery: Boolean(input.hasBattery),
    hasLiquid: Boolean(input.hasLiquid),
    needInsurance: Boolean(input.needInsurance),
    needPickup: true,
    isRemoteArea: Boolean(input.isRemoteArea),
    needClearanceSupport: Boolean(input.hasBattery || input.hasLiquid),
    isResidential: false
  });
  const duty = estimateDuty({
    destination: input.destination,
    declaredValue: input.declaredValue,
    freight: quote.total,
    incoterm: "DDU"
  });
  const recommended = quote.riskLevel === "需人工确认" ? "标准快递 + 人工审核" : Number(input.weight) <= 1 ? "优先快递" : "标准快递";
  const actions = [
    `推荐服务：${recommended}`,
    `建议线路：${quote.lane}`,
    `预计费用：${quote.formattedTotal}`,
    `税费预估：${formatMoney(duty.total)}`,
    quote.riskLevel === "需人工确认" ? "先联系客服确认品类和清关资料" : "可继续创建订单"
  ];
  return `
    <div class="result-box advisor-result">
      <div class="result-main">
        <div>
          <strong>智能建议</strong>
          <div class="price" style="font-size:26px">${quote.riskLevel}</div>
        </div>
        <a class="btn" href="#/ship">按建议下单</a>
      </div>
      <div class="recommendation-list">
        ${actions.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <div class="tag-list">${quote.checklist.map((item) => `<span>${item}</span>`).join("")}</div>
    </div>
  `;
}

function renderDutyResult(result) {
  return `
    <div class="result-box compact-result">
      <div class="result-main">
        <div>
          <strong>预计税费</strong>
          <div class="price" style="font-size:26px">${formatMoney(result.total)}</div>
        </div>
        <span class="status-pill">${result.incoterm}</span>
      </div>
      <div class="fee-list">
        <div><span>预估关税 ${Math.round(result.dutyRate * 100)}%</span><strong>${formatMoney(result.duty)}</strong></div>
        <div><span>预估税费 ${Math.round(result.vatRate * 100)}%</span><strong>${formatMoney(result.vat)}</strong></div>
        <div><span>清关处理费</span><strong>${formatMoney(result.clearanceFee)}</strong></div>
        <div class="total"><span>合计</span><strong>${formatMoney(result.total)}</strong></div>
      </div>
      <ul class="muted clean-list">${result.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
    </div>
  `;
}

function renderHsResult(items) {
  return `
    <div class="hs-results">
      ${items.map((item) => `
        <div class="hs-item">
          <strong>${item.code}</strong>
          <span>${item.name}</span>
          <small>关键词：${item.keyword} ｜ 参考税率：${Math.round(item.duty * 100)}%</small>
          <p>${item.note}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAddressScore(result) {
  return `
    <div class="address-score">
      <div class="score-ring">
        <strong>${result.score}</strong>
        <span>${result.level}</span>
      </div>
      <div>
        <div class="checklist-grid">
          ${result.checks.map((item) => `
            <div class="checklist-item ${item.ok ? "pass" : "fail"}">
              <strong>${item.ok ? "已通过" : "需补充"}</strong>
              <span>${item.label}</span>
            </div>
          `).join("")}
        </div>
        ${result.suggestions.length ? `<p class="muted">建议：${result.suggestions.join("、")}。</p>` : `<p class="muted">地址资料完整度较高，可继续下单。</p>`}
      </div>
    </div>
  `;
}

function renderInvoicePreview(order) {
  return `
    <div class="invoice-preview">
      <div class="invoice-head">
        <strong>Commercial Invoice</strong>
        <span>${order.id}</span>
      </div>
      <div class="summary-list">
        <div class="summary-row"><span>寄件方</span><strong>${escapeHtml(order.sender.name || "未填写")}</strong></div>
        <div class="summary-row"><span>收件方</span><strong>${escapeHtml(order.recipient.name || "未填写")}</strong></div>
        <div class="summary-row"><span>路线</span><strong>${escapeHtml(order.sender.country)} → ${escapeHtml(order.recipient.country)}</strong></div>
        <div class="summary-row"><span>物品</span><strong>${escapeHtml(order.parcel.itemName || "未填写")}</strong></div>
        <div class="summary-row"><span>价值</span><strong>${escapeHtml(order.parcel.currency || "USD")} ${escapeHtml(order.parcel.declaredValue || "0")}</strong></div>
        <div class="summary-row"><span>用途</span><strong>${escapeHtml(order.customs?.purpose || "个人自用")}</strong></div>
      </div>
      <div class="notice soft-notice">这是前端预览。真实商业发票需以后端订单、渠道和清关规则生成。</div>
    </div>
  `;
}

function countryOptions(selected = "") {
  return countries.map((item) => `<option value="${item.name}" ${item.name === selected ? "selected" : ""}>${item.name}</option>`).join("");
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
