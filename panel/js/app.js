/* ============================================================================
 * 🦊 北极狐 Arctic Fox — 节点可视化配置面板
 * 纯前端：输入隧道域名等参数，一键生成 VLESS / VMess / Trojan / TUIC 节点
 * 支持二维码、单条复制、复制全部、Base64 订阅，数据不离开浏览器
 * ==========================================================================*/
(function () {
  "use strict";

  var STORAGE_KEY = "beijihu-panel-v1";
  var $ = function (id) { return document.getElementById(id); };

  var fields = [
    "domain", "uuid", "name", "cdn", "port",
    "vlessPath", "vmessPath", "trojanPath",
    "tuicAddr", "tuicPort", "tuicPass"
  ];

  // ---- 工具函数 ----
  function uuidv4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // UTF-8 安全的 base64（VMess ps 名称可能含中文）
  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function normPath(p) {
    if (!p) return "/";
    return p.charAt(0) === "/" ? p : "/" + p;
  }

  function toast(msg, type) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = "toast"; }, 2000);
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

  // ---- 收集输入 ----
  function readState() {
    var s = {};
    fields.forEach(function (k) { s[k] = ($(k).value || "").trim(); });
    s.protocols = Array.prototype.slice
      .call(document.querySelectorAll(".proto:checked"))
      .map(function (el) { return el.value; });
    return s;
  }

  function persist(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      fields.forEach(function (k) { if (s[k] != null && $(k)) $(k).value = s[k]; });
      if (s.protocols) {
        document.querySelectorAll(".proto").forEach(function (el) {
          el.checked = s.protocols.indexOf(el.value) !== -1;
        });
      }
    } catch (e) {}
  }

  // ---- 生成各协议链接 ----
  function buildLinks(s) {
    var domain = s.domain;
    var name = s.name || "北极狐";
    var addr = s.cdn || domain;             // WS 节点的连接地址（可优选）
    var port = s.port || "443";
    var uuid = s.uuid;
    var out = [];

    if (s.protocols.indexOf("vless") !== -1) {
      var vp = encodeURIComponent(normPath(s.vlessPath || "/vless"));
      var vlink = "vless://" + uuid + "@" + addr + ":" + port +
        "?encryption=none&security=tls&sni=" + domain +
        "&fp=chrome&type=ws&host=" + domain + "&path=" + vp +
        "#" + encodeURIComponent(name + "-vless");
      out.push({ type: "vless", name: name + "-vless", link: vlink });
    }

    if (s.protocols.indexOf("vmess") !== -1) {
      var vmess = {
        v: "2", ps: name + "-vmess", add: addr, port: String(port),
        id: uuid, aid: "0", scy: "auto", net: "ws", type: "none",
        host: domain, path: normPath(s.vmessPath || "/vmess"),
        tls: "tls", sni: domain
      };
      out.push({
        type: "vmess", name: name + "-vmess",
        link: "vmess://" + utf8ToB64(JSON.stringify(vmess))
      });
    }

    if (s.protocols.indexOf("trojan") !== -1) {
      var tp = encodeURIComponent(normPath(s.trojanPath || "/trojan"));
      var tlink = "trojan://" + uuid + "@" + addr + ":" + port +
        "?security=tls&sni=" + domain +
        "&fp=chrome&type=ws&host=" + domain + "&path=" + tp +
        "#" + encodeURIComponent(name + "-trojan");
      out.push({ type: "trojan", name: name + "-trojan", link: tlink });
    }

    if (s.protocols.indexOf("tuic") !== -1) {
      var tuicAddr = s.tuicAddr || domain;
      var tuicPort = s.tuicPort || "443";
      var tuicPass = s.tuicPass || uuid;
      var tuicLink = "tuic://" + uuid + ":" + tuicPass + "@" + tuicAddr + ":" + tuicPort +
        "?congestion_control=bbr&alpn=h3&sni=" + domain + "&allow_insecure=1" +
        "#" + encodeURIComponent(name + "-tuic");
      out.push({ type: "tuic", name: name + "-tuic", link: tuicLink });
    }

    return out;
  }

  // ---- 渲染 ----
  function render(nodes) {
    var box = $("output");
    box.innerHTML = "";
    if (!nodes.length) {
      box.innerHTML = '<p style="color:var(--text-dim);text-align:center">未选择任何协议</p>';
      return;
    }
    var tpl = $("nodeCardTpl");
    nodes.forEach(function (n) {
      var node = tpl.content.cloneNode(true);
      var badge = node.querySelector(".badge");
      badge.textContent = n.type.toUpperCase();
      badge.classList.add(n.type);
      node.querySelector(".node-name").textContent = n.name;
      node.querySelector(".link").value = n.link;

      var qrEl = node.querySelector(".qr");
      try {
        new QRCode(qrEl, {
          text: n.link, width: 116, height: 116,
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (e) {
        qrEl.textContent = "二维码生成失败";
      }

      var copyBtn = node.querySelector(".copy");
      copyBtn.addEventListener("click", function () {
        copyText(n.link)
          .then(function () { toast("已复制 " + n.name, "ok"); })
          .catch(function () { toast("复制失败，请手动选择", "warn"); });
      });

      box.appendChild(node);
    });
  }

  // ---- 校验 + 生成 ----
  function generate() {
    var s = readState();
    if (!s.domain) { toast("请先填写隧道域名", "warn"); $("domain").focus(); return null; }
    if (!s.uuid) { toast("请先填写或生成 UUID", "warn"); $("uuid").focus(); return null; }
    if (!s.protocols.length) { toast("请至少勾选一个协议", "warn"); return null; }
    persist(s);
    var nodes = buildLinks(s);
    render(nodes);
    return nodes;
  }

  // ---- 事件绑定 ----
  function init() {
    restore();

    $("genUuid").addEventListener("click", function () {
      $("uuid").value = uuidv4();
      toast("已生成新的 UUID", "ok");
    });

    $("generate").addEventListener("click", generate);

    $("copyAll").addEventListener("click", function () {
      var nodes = generate();
      if (!nodes || !nodes.length) return;
      var all = nodes.map(function (n) { return n.link; }).join("\n");
      copyText(all)
        .then(function () { toast("已复制全部 " + nodes.length + " 个节点", "ok"); })
        .catch(function () { toast("复制失败", "warn"); });
    });

    $("copySub").addEventListener("click", function () {
      var nodes = generate();
      if (!nodes || !nodes.length) return;
      var sub = utf8ToB64(nodes.map(function (n) { return n.link; }).join("\n"));
      copyText(sub)
        .then(function () { toast("已复制 Base64 订阅内容", "ok"); })
        .catch(function () { toast("复制失败", "warn"); });
    });

    // 回车即生成
    document.querySelectorAll(".form-card input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); generate(); }
      });
    });

    // 若有已保存且完整的配置，自动渲染一次
    var s = readState();
    if (s.domain && s.uuid) generate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
