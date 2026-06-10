/* ============================================================================
 * TUIC Panel — 节点可视化生成面板
 * 纯前端：输入 TUIC 节点参数，生成 tuic:// 链接、二维码与 Base64 订阅
 * ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "tuic-panel-nodes-v1";
  var $ = function (id) { return document.getElementById(id); };

  var nodes = [];

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
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = "toast"; }, 2400);
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
      output.innerHTML = '<p class="empty-msg">暂无节点，请在上方添加</p>';
      return;
    }

    subSection.hidden = false;

    // Update subscription content
    var allLinks = nodes.map(function (n) { return n.link; }).join("\n");
    $("subContent").value = utf8ToB64(allLinks);

    // Render each node card
    nodes.forEach(function (node, idx) {
      var card = document.createElement("div");
      card.className = "node-card";
      card.innerHTML =
        '<div class="node-header">' +
          '<span class="badge">TUIC</span>' +
          '<span class="node-name">' + escHtml(node.name) + '</span>' +
          '<button type="button" class="del-btn" data-idx="' + idx + '" title="删除">✕</button>' +
        '</div>' +
        '<div class="node-qr" id="qr-' + idx + '"></div>' +
        '<div class="node-link-box">' +
          '<input class="node-link" value="' + escAttr(node.link) + '" readonly />' +
          '<button type="button" class="copy-btn" data-idx="' + idx + '">复制</button>' +
        '</div>';
      output.appendChild(card);

      // QR code
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
        qrEl.textContent = "二维码生成失败";
      }
    });

    // Bind events
    output.querySelectorAll(".del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.getAttribute("data-idx"), 10);
        nodes.splice(i, 1);
        persist();
        renderNodes();
        toast("已删除节点", "ok");
      });
    });

    output.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(this.getAttribute("data-idx"), 10);
        copyText(nodes[i].link)
          .then(function () { toast("已复制: " + nodes[i].name, "ok"); })
          .catch(function () { toast("复制失败", "warn"); });
      });
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

  // ---- Add node ----
  function addNode() {
    var cfg = readForm();
    if (!cfg.server) { toast("请填写服务器地址", "warn"); $("server").focus(); return; }
    if (!cfg.uuid) { toast("请填写或生成 UUID", "warn"); $("uuid").focus(); return; }
    if (!cfg.port) { toast("请填写端口", "warn"); $("port").focus(); return; }

    var link = buildTuicLink(cfg);
    nodes.push({ name: cfg.name, link: link, config: cfg });
    persist();
    renderNodes();
    toast("已添加: " + cfg.name, "ok");
  }

  // ---- Init ----
  function init() {
    restore();
    renderNodes();

    $("genUuid").addEventListener("click", function () {
      $("uuid").value = uuidv4();
      toast("已生成新 UUID", "ok");
    });

    $("addNode").addEventListener("click", addNode);

    $("clearAll").addEventListener("click", function () {
      if (!nodes.length) return;
      nodes = [];
      persist();
      renderNodes();
      toast("已清空所有节点", "ok");
    });

    $("copySub").addEventListener("click", function () {
      var content = $("subContent").value;
      if (!content) return;
      copyText(content)
        .then(function () { toast("已复制 Base64 订阅内容", "ok"); })
        .catch(function () { toast("复制失败", "warn"); });
    });

    $("copySubBtn").addEventListener("click", function () {
      var content = $("subContent").value;
      if (!content) return;
      copyText(content)
        .then(function () { toast("已复制 Base64 订阅内容", "ok"); })
        .catch(function () { toast("复制失败", "warn"); });
    });

    $("copyAllLinks").addEventListener("click", function () {
      if (!nodes.length) return;
      var all = nodes.map(function (n) { return n.link; }).join("\n");
      copyText(all)
        .then(function () { toast("已复制全部 " + nodes.length + " 个节点链接", "ok"); })
        .catch(function () { toast("复制失败", "warn"); });
    });

    // Enter to add
    document.querySelectorAll(".form-card input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); addNode(); }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
