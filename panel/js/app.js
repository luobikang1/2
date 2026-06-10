/* ============================================================================
 * Proxy Panel — 多协议节点可视化生成面板
 * 支持：VLESS / VMess / Trojan / Hysteria2 / TUIC
 * ========================================================================== */
(function () {
  "use strict";

  // ============================================================
  // CONFIG: Set password here. Leave "" to disable.
  // ============================================================
  var PANEL_PASSWORD = "";

  var STORAGE_KEY = "proxy-panel-nodes-v2";
  var LANG_KEY = "proxy-panel-lang";
  var CF_STORAGE_KEY = "proxy-panel-cf-usage-v1";
  var TRAFFIC_KEY = "proxy-panel-traffic-v1";
  var $ = function (id) { return document.getElementById(id); };

  var nodes = [];
  var lang = localStorage.getItem(LANG_KEY) || "zh";

  // ---- i18n ----
  function t(key) {
    var dict = window.TUIC_I18N || {};
    var tr = dict[lang] || dict.zh || {};
    return tr[key] || key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }

  // ---- Utilities ----
  function uuidv4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function toast(msg, type) {
    var el = $("toast");
    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.className = "toast"; }, 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function escHtml(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function escAttr(s) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // ---- Password ----
  function initLock() {
    var pw = PANEL_PASSWORD || "";
    if (!pw) { $("lockScreen").hidden = true; $("appMain").style.display = ""; return; }
    var params = new URLSearchParams(window.location.search);
    if ((params.get("pass") || "") === pw) { $("lockScreen").hidden = true; $("appMain").style.display = ""; return; }
    $("lockScreen").hidden = false; $("appMain").style.display = "none";
    function tryUnlock() {
      if ($("lockPass").value === pw) { $("lockScreen").hidden = true; $("appMain").style.display = ""; $("lockError").hidden = true; }
      else { $("lockError").hidden = false; }
    }
    $("lockSubmit").addEventListener("click", tryUnlock);
    $("lockPass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });
  }

  // ---- Protocol Link Builders ----
  function buildVlessLink(cfg) {
    var params = "encryption=none&type=" + cfg.transport +
      "&security=" + cfg.security +
      "&sni=" + (cfg.sni || cfg.server) +
      "&alpn=" + encodeURIComponent(cfg.alpn) +
      "&allowInsecure=" + cfg.allowInsecure;
    if (cfg.transport === "ws") params += "&path=" + encodeURIComponent(cfg.path || "/") + "&host=" + (cfg.sni || cfg.server);
    if (cfg.transport === "grpc") params += "&serviceName=" + encodeURIComponent(cfg.path || "");
    return "vless://" + cfg.uuid + "@" + cfg.server + ":" + cfg.port + "?" + params + "#" + encodeURIComponent(cfg.name);
  }

  function buildVmessLink(cfg) {
    var obj = {
      v: "2", ps: cfg.name, add: cfg.server, port: cfg.port,
      id: cfg.uuid, aid: "0", scy: "auto",
      net: cfg.transport, type: "none",
      host: cfg.sni || cfg.server, path: cfg.path || "/",
      tls: cfg.security === "none" ? "" : "tls",
      sni: cfg.sni || cfg.server,
      alpn: cfg.alpn
    };
    return "vmess://" + utf8ToB64(JSON.stringify(obj));
  }

  function buildTrojanLink(cfg) {
    var params = "type=" + cfg.transport +
      "&security=" + cfg.security +
      "&sni=" + (cfg.sni || cfg.server) +
      "&alpn=" + encodeURIComponent(cfg.alpn) +
      "&allowInsecure=" + cfg.allowInsecure;
    if (cfg.transport === "ws") params += "&path=" + encodeURIComponent(cfg.path || "/") + "&host=" + (cfg.sni || cfg.server);
    if (cfg.transport === "grpc") params += "&serviceName=" + encodeURIComponent(cfg.path || "");
    return "trojan://" + cfg.uuid + "@" + cfg.server + ":" + cfg.port + "?" + params + "#" + encodeURIComponent(cfg.name);
  }

  function buildHysteria2Link(cfg) {
    var params = "sni=" + (cfg.sni || cfg.server) +
      "&alpn=" + encodeURIComponent(cfg.alpn || "h3") +
      "&insecure=" + cfg.allowInsecure;
    return "hysteria2://" + cfg.uuid + "@" + cfg.server + ":" + cfg.port + "?" + params + "#" + encodeURIComponent(cfg.name);
  }

  function buildTuicLink(cfg) {
    var password = cfg.uuid;
    var sni = cfg.sni || cfg.server;
    return "tuic://" + cfg.uuid + ":" + password +
      "@" + cfg.server + ":" + cfg.port +
      "?congestion_control=" + (cfg.congestion || "bbr") +
      "&alpn=" + encodeURIComponent(cfg.alpn || "h3") +
      "&sni=" + sni +
      "&udp_relay_mode=native" +
      "&allow_insecure=" + cfg.allowInsecure +
      "#" + encodeURIComponent(cfg.name);
  }

  function buildLink(cfg) {
    switch (cfg.protocol) {
      case "vless": return buildVlessLink(cfg);
      case "vmess": return buildVmessLink(cfg);
      case "trojan": return buildTrojanLink(cfg);
      case "hysteria2": return buildHysteria2Link(cfg);
      case "tuic": return buildTuicLink(cfg);
      default: return buildVlessLink(cfg);
    }
  }

  // ---- Persistence ----
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)); } catch (e) {} }
  function restore() { try { var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); if (Array.isArray(s)) nodes = s; } catch (e) {} }

  // ---- Read form ----
  function readForm() {
    return {
      protocol: $("protocol").value,
      server: ($("server").value || "").trim(),
      port: ($("port").value || "443").trim(),
      uuid: ($("uuid").value || "").trim(),
      sni: ($("sni").value || "").trim(),
      name: ($("nodeName").value || "Proxy-Node").trim(),
      transport: $("transport").value,
      security: $("security").value,
      path: ($("wsPath").value || "").trim(),
      alpn: $("alpn").value,
      congestion: $("congestion").value,
      allowInsecure: $("allowInsecure").value
    };
  }

  // ---- Render nodes ----
  function renderNodes() {
    var output = $("nodesOutput");
    var subSection = $("subSection");
    output.innerHTML = "";
    if (!nodes.length) { subSection.hidden = true; output.innerHTML = '<p class="empty-msg">' + t("empty_nodes") + '</p>'; return; }
    subSection.hidden = false;
    $("subContent").value = utf8ToB64(nodes.map(function (n) { return n.link; }).join("\n"));

    nodes.forEach(function (node, idx) {
      var card = document.createElement("div");
      card.className = "node-card";
      var proto = (node.config && node.config.protocol) || "vless";
      card.innerHTML =
        '<div class="node-header">' +
          '<span class="badge badge-' + proto + '">' + proto.toUpperCase() + '</span>' +
          '<span class="node-name">' + escHtml(node.name) + '</span>' +
          '<button type="button" class="del-btn" data-idx="' + idx + '">✕</button>' +
        '</div>' +
        '<div class="node-qr" id="qr-' + idx + '"></div>' +
        '<div class="node-link-box">' +
          '<input class="node-link" value="' + escAttr(node.link) + '" readonly />' +
          '<button type="button" class="copy-btn" data-idx="' + idx + '">' + (lang === "zh" ? "复制" : "Copy") + '</button>' +
        '</div>';
      output.appendChild(card);

      try {
        new QRCode(document.getElementById("qr-" + idx), {
          text: node.link, width: 160, height: 160,
          correctLevel: QRCode.CorrectLevel.M, colorDark: "#1a1a2e", colorLight: "#ffffff"
        });
      } catch (e) {}
    });

    output.querySelectorAll(".del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        nodes.splice(parseInt(this.getAttribute("data-idx"), 10), 1);
        persist(); renderNodes(); toast(t("toast_del"), "ok");
      });
    });
    output.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.getAttribute("data-idx"), 10);
        copyText(nodes[i].link).then(function () { toast(t("toast_copied") + nodes[i].name, "ok"); }).catch(function () { toast(t("toast_copy_fail"), "warn"); });
      });
    });
  }

  // ---- Add node ----
  function addNode() {
    var cfg = readForm();
    if (!cfg.server) { toast(t("toast_no_server"), "warn"); $("server").focus(); return; }
    if (!cfg.uuid) { toast(t("toast_no_uuid"), "warn"); $("uuid").focus(); return; }
    if (!cfg.port) { toast(t("toast_no_port"), "warn"); $("port").focus(); return; }
    var link = buildLink(cfg);
    nodes.push({ name: cfg.name, link: link, config: cfg });
    persist(); renderNodes();
    toast(t("toast_add") + cfg.name, "ok");
  }

  // ---- Quick generate ----
  function quickGenerate() {
    var server = ($("quickServer").value || "").trim();
    if (!server) { toast(t("toast_no_domain"), "warn"); $("quickServer").focus(); return; }
    var proto = $("quickProto").value;
    var uuid = uuidv4();
    var cfg = {
      protocol: proto,
      server: server,
      port: "443",
      uuid: uuid,
      sni: server,
      name: proto.toUpperCase() + "-" + server.split(".")[0],
      transport: "ws",
      security: "tls",
      path: "/" + uuidv4().slice(0, 8),
      alpn: proto === "tuic" || proto === "hysteria2" ? "h3" : "h2,http/1.1",
      congestion: "bbr",
      allowInsecure: "0"
    };
    var link = buildLink(cfg);
    nodes.push({ name: cfg.name, link: link, config: cfg });
    persist(); renderNodes();
    toast(t("toast_gen") + cfg.name, "ok");
  }

  // ---- Traffic Monitor ----
  function toMB(val, unit) {
    if (unit === "GB") return val * 1024;
    if (unit === "TB") return val * 1024 * 1024;
    return val;
  }

  function updateTraffic() {
    var used = parseFloat($("trafficUsed").value) || 0;
    var usedUnit = $("trafficUnit").value;
    var limit = parseFloat($("trafficLimit").value) || 100;
    var limitUnit = $("trafficLimitUnit").value;
    var usedMB = toMB(used, usedUnit);
    var limitMB = toMB(limit, limitUnit);
    var pct = limitMB > 0 ? Math.min((usedMB / limitMB) * 100, 100) : 0;
    $("trafficPct").textContent = pct.toFixed(1) + "%";
    var bar = $("trafficBar");
    bar.style.width = pct + "%";
    bar.className = "traffic-bar";
    if (pct >= 90) bar.classList.add("danger");
    else if (pct >= 70) bar.classList.add("warn");
    try { localStorage.setItem(TRAFFIC_KEY, JSON.stringify({ used: used, usedUnit: usedUnit, limit: limit, limitUnit: limitUnit })); } catch (e) {}
  }

  function restoreTraffic() {
    try {
      var d = JSON.parse(localStorage.getItem(TRAFFIC_KEY) || "{}");
      if (d.used != null) $("trafficUsed").value = d.used;
      if (d.usedUnit) $("trafficUnit").value = d.usedUnit;
      if (d.limit != null) $("trafficLimit").value = d.limit;
      if (d.limitUnit) $("trafficLimitUnit").value = d.limitUnit;
    } catch (e) {}
  }

  // ---- CF Dashboard ----
  var cfItems = [
    { id: "Pages", inputId: "cfPages", barId: "cfBarPages", max: 500 },
    { id: "Workers", inputId: "cfWorkers", barId: "cfBarWorkers", max: 100000 },
    { id: "KvRead", inputId: "cfKvRead", barId: "cfBarKvRead", max: 100000 },
    { id: "KvWrite", inputId: "cfKvWrite", barId: "cfBarKvWrite", max: 1000 },
    { id: "R2", inputId: "cfR2", barId: "cfBarR2", max: 10 },
    { id: "R2A", inputId: "cfR2A", barId: "cfBarR2A", max: 1000000 },
    { id: "R2B", inputId: "cfR2B", barId: "cfBarR2B", max: 10000000 },
    { id: "D1", inputId: "cfD1", barId: "cfBarD1", max: 5000000 }
  ];

  function updateCfBars() {
    var data = {};
    cfItems.forEach(function (item) {
      var val = parseFloat($(item.inputId).value) || 0;
      var pct = Math.min((val / item.max) * 100, 100);
      var bar = $(item.barId);
      bar.style.width = pct + "%";
      bar.className = "cf-bar";
      if (pct >= 90) bar.classList.add("danger");
      else if (pct >= 70) bar.classList.add("warn");
      data[item.id] = val;
    });
    try { localStorage.setItem(CF_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function restoreCfData() {
    try {
      var data = JSON.parse(localStorage.getItem(CF_STORAGE_KEY) || "{}");
      cfItems.forEach(function (item) { if (data[item.id] != null) $(item.inputId).value = data[item.id]; });
    } catch (e) {}
  }

  // ---- Init ----
  function init() {
    initLock();
    applyI18n();
    restore();
    renderNodes();

    // Language
    $("langToggle").addEventListener("click", function () {
      lang = lang === "zh" ? "en" : "zh";
      localStorage.setItem(LANG_KEY, lang);
      applyI18n(); renderNodes();
    });

    // Quick gen
    $("quickGen").addEventListener("click", quickGenerate);
    $("quickServer").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); quickGenerate(); } });

    // UUID
    $("genUuid").addEventListener("click", function () { $("uuid").value = uuidv4(); toast(t("toast_uuid"), "ok"); });

    // Add / Clear
    $("addNode").addEventListener("click", addNode);
    $("clearAll").addEventListener("click", function () { if (!nodes.length) return; nodes = []; persist(); renderNodes(); toast(t("toast_clear"), "ok"); });

    // Copy
    $("copySub").addEventListener("click", function () { copyText($("subContent").value).then(function () { toast(t("toast_copy_sub"), "ok"); }).catch(function () { toast(t("toast_copy_fail"), "warn"); }); });
    $("copySubBtn").addEventListener("click", function () { copyText($("subContent").value).then(function () { toast(t("toast_copy_sub"), "ok"); }).catch(function () { toast(t("toast_copy_fail"), "warn"); }); });
    $("copyAllLinks").addEventListener("click", function () {
      if (!nodes.length) return;
      copyText(nodes.map(function (n) { return n.link; }).join("\n")).then(function () { toast(t("toast_copy_all"), "ok"); }).catch(function () { toast(t("toast_copy_fail"), "warn"); });
    });

    // Enter to add
    document.querySelectorAll(".form-card input").forEach(function (el) {
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addNode(); } });
    });

    // Traffic
    restoreTraffic();
    updateTraffic();
    ["trafficUsed", "trafficUnit", "trafficLimit", "trafficLimitUnit"].forEach(function (id) {
      $(id).addEventListener("input", updateTraffic);
      $(id).addEventListener("change", updateTraffic);
    });

    // CF Dashboard
    restoreCfData();
    updateCfBars();
    $("cfUpdate").addEventListener("click", function () { updateCfBars(); toast(t("toast_cf_refresh"), "ok"); });
    $("cfReset").addEventListener("click", function () { cfItems.forEach(function (item) { $(item.inputId).value = 0; }); updateCfBars(); toast(t("toast_cf_reset"), "ok"); });
    cfItems.forEach(function (item) { $(item.inputId).addEventListener("input", updateCfBars); });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }
})();
