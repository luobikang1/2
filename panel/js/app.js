/* ============================================================================
 * TUIC Panel — 节点可视化生成面板
 * 支持：一键生成 / 自定义配置 / 二维码 / Base64 订阅 / 密码保护 / 中英切换
 * ========================================================================== */
(function () {
  "use strict";

  // ============================================================
  // CONFIG: Set password here or via environment variable PANEL_PASS
  // Leave empty string "" to disable password protection
  // ============================================================
  var PANEL_PASSWORD = "";

  var STORAGE_KEY = "tuic-panel-nodes-v1";
  var LANG_KEY = "tuic-panel-lang";
  var CF_STORAGE_KEY = "tuic-panel-cf-usage-v1";
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
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = t(key);
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

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escAttr(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---- Password Protection ----
  function getConfiguredPassword() {
    return PANEL_PASSWORD || "";
  }

  function checkUrlPass() {
    var params = new URLSearchParams(window.location.search);
    return params.get("pass") || "";
  }

  function initLock() {
    var pw = getConfiguredPassword();
    if (!pw) {
      $("lockScreen").hidden = true;
      $("appMain").style.display = "";
      return;
    }

    var urlPass = checkUrlPass();
    if (urlPass === pw) {
      $("lockScreen").hidden = true;
      $("appMain").style.display = "";
      return;
    }

    $("lockScreen").hidden = false;
    $("appMain").style.display = "none";

    $("lockSubmit").addEventListener("click", tryUnlock);
    $("lockPass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryUnlock();
    });
  }

  function tryUnlock() {
    var input = $("lockPass").value;
    if (input === getConfiguredPassword()) {
      $("lockScreen").hidden = true;
      $("appMain").style.display = "";
      $("lockError").hidden = true;
    } else {
      $("lockError").hidden = false;
    }
  }

  // ---- Build TUIC link ----
  function buildTuicLink(cfg) {
    var password = cfg.password || cfg.uuid;
    var sni = cfg.sni || cfg.server;
    var link = "tuic://" + cfg.uuid + ":" + password +
      "@" + cfg.server + ":" + cfg.port +
      "?congestion_control=" + cfg.congestion +
      "&alpn=" + encodeURIComponent(cfg.alpn) +
      "&sni=" + sni +
      "&udp_relay_mode=" + cfg.udpRelay +
      "&allow_insecure=" + cfg.allowInsecure +
      "#" + encodeURIComponent(cfg.name);
    return link;
  }

  // ---- Persistence ----
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)); } catch (e) {}
  }

  function restore() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) nodes = saved;
    } catch (e) {}
  }

  // ---- Read form ----
  function readForm() {
    return {
      server: ($("server").value || "").trim(),
      port: ($("port").value || "443").trim(),
      uuid: ($("uuid").value || "").trim(),
      password: ($("password").value || "").trim(),
      sni: ($("sni").value || "").trim(),
      name: ($("nodeName").value || "TUIC-Node").trim(),
      congestion: $("congestion").value,
      alpn: $("alpn").value,
      udpRelay: $("udpRelay").value,
      allowInsecure: $("allowInsecure").value
    };
  }

  // ---- Render nodes ----
  function renderNodes() {
    var output = $("nodesOutput");
    var subSection = $("subSection");
    output.innerHTML = "";

    if (!nodes.length) {
      subSection.hidden = true;
      output.innerHTML = '<p class="empty-msg">' + t("empty_nodes") + '</p>';
      return;
    }

    subSection.hidden = false;
    var allLinks = nodes.map(function (n) { return n.link; }).join("\n");
    $("subContent").value = utf8ToB64(allLinks);

    nodes.forEach(function (node, idx) {
      var card = document.createElement("div");
      card.className = "node-card";
      card.innerHTML =
        '<div class="node-header">' +
          '<span class="badge">TUIC</span>' +
          '<span class="node-name">' + escHtml(node.name) + '</span>' +
          '<button type="button" class="del-btn" data-idx="' + idx + '" title="Delete">✕</button>' +
        '</div>' +
        '<div class="node-qr" id="qr-' + idx + '"></div>' +
        '<div class="node-link-box">' +
          '<input class="node-link" value="' + escAttr(node.link) + '" readonly />' +
          '<button type="button" class="copy-btn" data-idx="' + idx + '">' + (lang === "zh" ? "复制" : "Copy") + '</button>' +
        '</div>';
      output.appendChild(card);

      var qrEl = document.getElementById("qr-" + idx);
      try {
        new QRCode(qrEl, {
          text: node.link,
          width: 160,
          height: 160,
          correctLevel: QRCode.CorrectLevel.M,
          colorDark: "#1a1a2e",
          colorLight: "#ffffff"
        });
      } catch (e) {
        qrEl.textContent = "QR Error";
      }
    });

    output.querySelectorAll(".del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.getAttribute("data-idx"), 10);
        nodes.splice(i, 1);
        persist();
        renderNodes();
        toast(t("toast_del"), "ok");
      });
    });

    output.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.getAttribute("data-idx"), 10);
        copyText(nodes[i].link)
          .then(function () { toast(t("toast_copied") + nodes[i].name, "ok"); })
          .catch(function () { toast(t("toast_copy_fail"), "warn"); });
      });
    });
  }

  // ---- Add node ----
  function addNode() {
    var cfg = readForm();
    if (!cfg.server) { toast(t("toast_no_server"), "warn"); $("server").focus(); return; }
    if (!cfg.uuid) { toast(t("toast_no_uuid"), "warn"); $("uuid").focus(); return; }
    if (!cfg.port) { toast(t("toast_no_port"), "warn"); $("port").focus(); return; }

    var link = buildTuicLink(cfg);
    nodes.push({ name: cfg.name, link: link, config: cfg });
    persist();
    renderNodes();
    toast(t("toast_add") + cfg.name, "ok");
  }

  // ---- Quick generate ----
  function quickGenerate() {
    var server = ($("quickServer").value || "").trim();
    if (!server) { toast(t("toast_no_domain"), "warn"); $("quickServer").focus(); return; }

    var uuid = uuidv4();
    var cfg = {
      server: server,
      port: "443",
      uuid: uuid,
      password: uuid,
      sni: server,
      name: "TUIC-" + server.split(".")[0],
      congestion: "bbr",
      alpn: "h3",
      udpRelay: "native",
      allowInsecure: "1"
    };

    var link = buildTuicLink(cfg);
    nodes.push({ name: cfg.name, link: link, config: cfg });
    persist();
    renderNodes();
    toast(t("toast_gen") + cfg.name, "ok");
  }

  // ---- Cloudflare Usage Dashboard ----
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
      var input = $(item.inputId);
      var bar = $(item.barId);
      var val = parseFloat(input.value) || 0;
      var pct = Math.min((val / item.max) * 100, 100);
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
      cfItems.forEach(function (item) {
        if (data[item.id] != null) $(item.inputId).value = data[item.id];
      });
    } catch (e) {}
  }

  function initCfDashboard() {
    restoreCfData();
    updateCfBars();
    $("cfUpdate").addEventListener("click", function () {
      updateCfBars();
      toast(t("toast_cf_refresh"), "ok");
    });
    $("cfReset").addEventListener("click", function () {
      cfItems.forEach(function (item) { $(item.inputId).value = 0; });
      updateCfBars();
      toast(t("toast_cf_reset"), "ok");
    });
    cfItems.forEach(function (item) {
      $(item.inputId).addEventListener("input", updateCfBars);
    });
  }

  // ---- Init ----
  function init() {
    initLock();
    applyI18n();
    restore();
    renderNodes();

    // Language toggle
    $("langToggle").addEventListener("click", function () {
      lang = lang === "zh" ? "en" : "zh";
      localStorage.setItem(LANG_KEY, lang);
      applyI18n();
      renderNodes();
    });

    // Quick generate
    $("quickGen").addEventListener("click", quickGenerate);
    $("quickServer").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); quickGenerate(); }
    });

    // UUID generator
    $("genUuid").addEventListener("click", function () {
      $("uuid").value = uuidv4();
      toast(t("toast_uuid"), "ok");
    });

    // Add node
    $("addNode").addEventListener("click", addNode);

    // Clear all
    $("clearAll").addEventListener("click", function () {
      if (!nodes.length) return;
      nodes = [];
      persist();
      renderNodes();
      toast(t("toast_clear"), "ok");
    });

    // Copy subscription
    $("copySub").addEventListener("click", function () {
      var content = $("subContent").value;
      if (!content) return;
      copyText(content)
        .then(function () { toast(t("toast_copy_sub"), "ok"); })
        .catch(function () { toast(t("toast_copy_fail"), "warn"); });
    });
    $("copySubBtn").addEventListener("click", function () {
      var content = $("subContent").value;
      if (!content) return;
      copyText(content)
        .then(function () { toast(t("toast_copy_sub"), "ok"); })
        .catch(function () { toast(t("toast_copy_fail"), "warn"); });
    });
    $("copyAllLinks").addEventListener("click", function () {
      if (!nodes.length) return;
      var all = nodes.map(function (n) { return n.link; }).join("\n");
      copyText(all)
        .then(function () { toast(t("toast_copy_all"), "ok"); })
        .catch(function () { toast(t("toast_copy_fail"), "warn"); });
    });

    // Enter to add
    document.querySelectorAll(".form-card input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); addNode(); }
      });
    });

    // CF Dashboard
    initCfDashboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
