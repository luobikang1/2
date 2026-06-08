/* ============================================================================
 * 🦊 北极狐 Arctic Fox v2 — 节点可视化配置面板
 * 纯前端：输入隧道域名等参数，一键生成 VLESS / VMess / Trojan / TUIC / Hysteria2 节点
 * 支持二维码、单条复制、复制全部、Base64 订阅、Clash 订阅、SingBox 订阅
 * 支持亮/暗色主题切换、中/英双语
 * ==========================================================================*/
(function () {
  "use strict";

  var STORAGE_KEY = "beijihu-panel-v2";
  var $ = function (id) { return document.getElementById(id); };

  var fields = [
    "domain", "uuid", "name", "cdn", "port",
    "vlessPath", "vmessPath", "trojanPath",
    "tuicAddr", "tuicPort", "tuicPass",
    "hy2Addr", "hy2Port", "hy2Pass"
  ];

  // ==== i18n ====
  var i18n = {
    zh: {
      tagline: "TUIC + Hysteria2 + Cloudflare Argo 隧道节点 · 可视化配置面板",
      hint: '输入你的<strong>隧道域名</strong>即可一键生成节点 · 支持二维码 · 一键复制 · 多格式订阅',
      section_basic: "① 基本配置",
      section_advanced: "② 高级选项（路径 / TUIC / Hysteria2，一般保持默认）",
      label_domain: '隧道域名 <em>*</em>',
      label_uuid: 'UUID <em>*</em>',
      label_name: "节点名称",
      label_cdn: "优选地址 / CDN",
      label_port: "端口 (CF)",
      label_tuic_addr: "TUIC 服务器地址 / IP",
      label_tuic_port: "TUIC 端口 (UDP)",
      label_tuic_pass: "TUIC 密码",
      label_hy2_addr: "Hysteria2 服务器地址 / IP",
      label_hy2_port: "Hysteria2 端口 (UDP)",
      label_hy2_pass: "Hysteria2 密码",
      help_domain: "Cloudflare 隧道绑定的域名（必填）",
      help_uuid: "需与容器内 UUID 一致",
      help_name: "显示在客户端里的名字",
      help_cdn: "可填 Cloudflare 优选 IP / 域名（仅 WS 节点）",
      help_port: "VLESS/VMess/Trojan 经 Cloudflare 的端口",
      help_tuic_addr: "TUIC 为直连，建议填服务器公网 IP",
      help_hy2_addr: "Hysteria2 为直连，建议填服务器公网 IP",
      proto_title: "生成协议：",
      btn_generate: "⚡ 生成节点",
      btn_copy_all: "📋 复制全部",
      btn_copy_sub: "🔗 Base64 订阅",
      btn_copy_clash: "⚙️ Clash 订阅",
      btn_copy_singbox: "📦 SingBox 订阅",
      footer: "🦊 北极狐 Arctic Fox v2 · 纯前端生成，数据不离开你的浏览器 · 可部署到 GitHub Pages / Cloudflare Pages / Vercel / Netlify",
      toast_uuid: "已生成新的 UUID",
      toast_copied: "已复制",
      toast_copied_all: "已复制全部 {n} 个节点",
      toast_copied_sub: "已复制 Base64 订阅内容",
      toast_copied_clash: "已复制 Clash Meta 订阅配置",
      toast_copied_singbox: "已复制 SingBox 订阅配置",
      toast_fail: "复制失败，请手动选择",
      toast_no_domain: "请先填写隧道域名",
      toast_no_uuid: "请先填写或生成 UUID",
      toast_no_proto: "请至少勾选一个协议",
      toast_no_nodes: "未选择任何协议"
    },
    en: {
      tagline: "TUIC + Hysteria2 + Cloudflare Argo Tunnel · Visual Config Panel",
      hint: 'Enter your <strong>tunnel domain</strong> to generate nodes · QR code · One-click copy · Multi-format subscriptions',
      section_basic: "① Basic Config",
      section_advanced: "② Advanced (Path / TUIC / Hysteria2, keep defaults usually)",
      label_domain: 'Tunnel Domain <em>*</em>',
      label_uuid: 'UUID <em>*</em>',
      label_name: "Node Name",
      label_cdn: "Preferred IP / CDN",
      label_port: "Port (CF)",
      label_tuic_addr: "TUIC Server Address / IP",
      label_tuic_port: "TUIC Port (UDP)",
      label_tuic_pass: "TUIC Password",
      label_hy2_addr: "Hysteria2 Server Address / IP",
      label_hy2_port: "Hysteria2 Port (UDP)",
      label_hy2_pass: "Hysteria2 Password",
      help_domain: "Domain bound to your Cloudflare tunnel (required)",
      help_uuid: "Must match UUID in the Docker container",
      help_name: "Display name in your proxy client",
      help_cdn: "Cloudflare preferred IP / domain (WS nodes only)",
      help_port: "Cloudflare-proxied port for VLESS/VMess/Trojan",
      help_tuic_addr: "Direct connection — use server public IP",
      help_hy2_addr: "Direct connection — use server public IP",
      proto_title: "Protocols:",
      btn_generate: "⚡ Generate",
      btn_copy_all: "📋 Copy All",
      btn_copy_sub: "🔗 Base64 Sub",
      btn_copy_clash: "⚙️ Clash Sub",
      btn_copy_singbox: "📦 SingBox Sub",
      footer: "🦊 Arctic Fox v2 · Client-side generation, data never leaves your browser · Deploy to GitHub Pages / Cloudflare Pages / Vercel / Netlify",
      toast_uuid: "New UUID generated",
      toast_copied: "Copied",
      toast_copied_all: "Copied all {n} nodes",
      toast_copied_sub: "Copied Base64 subscription",
      toast_copied_clash: "Copied Clash Meta subscription",
      toast_copied_singbox: "Copied SingBox subscription",
      toast_fail: "Copy failed, please select manually",
      toast_no_domain: "Please enter tunnel domain",
      toast_no_uuid: "Please enter or generate UUID",
      toast_no_proto: "Please select at least one protocol",
      toast_no_nodes: "No protocol selected"
    }
  };

  var currentLang = "zh";

  function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) || key; }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var text = t(key);
      if (text) el.innerHTML = text;
    });
  }

  // ==== Theme ====
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("themeToggle").textContent = theme === "light" ? "🌙" : "☀️";
    try { localStorage.setItem("beijihu-theme", theme); } catch (e) {}
  }

  function loadTheme() {
    var saved = null;
    try { saved = localStorage.getItem("beijihu-theme"); } catch (e) {}
    setTheme(saved || "dark");
  }

  // ==== Utility ====
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

  function normPath(p) {
    if (!p) return "/";
    return p.charAt(0) === "/" ? p : "/" + p;
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

  // ==== State ====
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
      if (s.lang) { currentLang = s.lang; }
    } catch (e) {}
  }

  // ==== Link Generation ====
  function buildLinks(s) {
    var domain = s.domain;
    var name = s.name || "北极狐";
    var addr = s.cdn || domain;
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
        tls: "tls", sni: domain, fp: "chrome"
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

    if (s.protocols.indexOf("hysteria2") !== -1) {
      var hy2Addr = s.hy2Addr || domain;
      var hy2Port = s.hy2Port || "8443";
      var hy2Pass = s.hy2Pass || uuid;
      var hy2Link = "hysteria2://" + hy2Pass + "@" + hy2Addr + ":" + hy2Port +
        "?sni=" + domain + "&alpn=h3&insecure=1" +
        "#" + encodeURIComponent(name + "-hysteria2");
      out.push({ type: "hysteria2", name: name + "-hysteria2", link: hy2Link });
    }

    return out;
  }

  // ==== Clash Meta subscription generation ====
  function buildClash(s, nodes) {
    var domain = s.domain;
    var name = s.name || "北极狐";
    var addr = s.cdn || domain;
    var port = parseInt(s.port || "443", 10);
    var uuid = s.uuid;
    var proxies = [];
    var proxyNames = [];

    if (s.protocols.indexOf("vless") !== -1) {
      var pname = name + "-vless";
      proxyNames.push(pname);
      proxies.push(
        "  - name: \"" + pname + "\"\n" +
        "    type: vless\n" +
        "    server: " + addr + "\n" +
        "    port: " + port + "\n" +
        "    uuid: " + uuid + "\n" +
        "    network: ws\n" +
        "    tls: true\n" +
        "    udp: true\n" +
        "    servername: " + domain + "\n" +
        "    client-fingerprint: chrome\n" +
        "    ws-opts:\n" +
        "      path: " + normPath(s.vlessPath || "/vless") + "\n" +
        "      headers:\n" +
        "        Host: " + domain
      );
    }

    if (s.protocols.indexOf("vmess") !== -1) {
      var pname2 = name + "-vmess";
      proxyNames.push(pname2);
      proxies.push(
        "  - name: \"" + pname2 + "\"\n" +
        "    type: vmess\n" +
        "    server: " + addr + "\n" +
        "    port: " + port + "\n" +
        "    uuid: " + uuid + "\n" +
        "    alterId: 0\n" +
        "    cipher: auto\n" +
        "    network: ws\n" +
        "    tls: true\n" +
        "    udp: true\n" +
        "    servername: " + domain + "\n" +
        "    client-fingerprint: chrome\n" +
        "    ws-opts:\n" +
        "      path: " + normPath(s.vmessPath || "/vmess") + "\n" +
        "      headers:\n" +
        "        Host: " + domain
      );
    }

    if (s.protocols.indexOf("trojan") !== -1) {
      var pname3 = name + "-trojan";
      proxyNames.push(pname3);
      proxies.push(
        "  - name: \"" + pname3 + "\"\n" +
        "    type: trojan\n" +
        "    server: " + addr + "\n" +
        "    port: " + port + "\n" +
        "    password: " + uuid + "\n" +
        "    network: ws\n" +
        "    tls: true\n" +
        "    udp: true\n" +
        "    sni: " + domain + "\n" +
        "    client-fingerprint: chrome\n" +
        "    ws-opts:\n" +
        "      path: " + normPath(s.trojanPath || "/trojan") + "\n" +
        "      headers:\n" +
        "        Host: " + domain
      );
    }

    if (s.protocols.indexOf("tuic") !== -1) {
      var tuicAddr = s.tuicAddr || domain;
      var tuicPort = parseInt(s.tuicPort || "443", 10);
      var tuicPass = s.tuicPass || uuid;
      var pname4 = name + "-tuic";
      proxyNames.push(pname4);
      proxies.push(
        "  - name: \"" + pname4 + "\"\n" +
        "    type: tuic\n" +
        "    server: " + tuicAddr + "\n" +
        "    port: " + tuicPort + "\n" +
        "    uuid: " + uuid + "\n" +
        "    password: " + tuicPass + "\n" +
        "    alpn:\n" +
        "      - h3\n" +
        "    congestion-controller: bbr\n" +
        "    sni: " + domain + "\n" +
        "    skip-cert-verify: true\n" +
        "    udp: true"
      );
    }

    if (s.protocols.indexOf("hysteria2") !== -1) {
      var hy2Addr = s.hy2Addr || domain;
      var hy2Port = parseInt(s.hy2Port || "8443", 10);
      var hy2Pass = s.hy2Pass || uuid;
      var pname5 = name + "-hysteria2";
      proxyNames.push(pname5);
      proxies.push(
        "  - name: \"" + pname5 + "\"\n" +
        "    type: hysteria2\n" +
        "    server: " + hy2Addr + "\n" +
        "    port: " + hy2Port + "\n" +
        "    password: " + hy2Pass + "\n" +
        "    alpn:\n" +
        "      - h3\n" +
        "    sni: " + domain + "\n" +
        "    skip-cert-verify: true"
      );
    }

    var yaml = "# 🦊 北极狐 Arctic Fox v2 — Clash Meta 订阅\n" +
      "# Auto-generated by Arctic Fox Panel\n\n" +
      "mixed-port: 7890\n" +
      "allow-lan: false\n" +
      "mode: rule\n" +
      "log-level: info\n\n" +
      "dns:\n" +
      "  enable: true\n" +
      "  enhanced-mode: fake-ip\n" +
      "  nameserver:\n" +
      "    - https://dns.google/dns-query\n" +
      "    - https://1.1.1.1/dns-query\n\n" +
      "proxies:\n" + proxies.join("\n\n") + "\n\n" +
      "proxy-groups:\n" +
      "  - name: \"🦊 北极狐\"\n" +
      "    type: select\n" +
      "    proxies:\n" +
      proxyNames.map(function (n) { return "      - \"" + n + "\""; }).join("\n") + "\n\n" +
      "rules:\n" +
      "  - GEOIP,CN,DIRECT\n" +
      "  - MATCH,🦊 北极狐\n";

    return yaml;
  }

  // ==== SingBox subscription generation ====
  function buildSingBox(s, nodes) {
    var domain = s.domain;
    var name = s.name || "北极狐";
    var addr = s.cdn || domain;
    var port = parseInt(s.port || "443", 10);
    var uuid = s.uuid;
    var outbounds = [];

    if (s.protocols.indexOf("vless") !== -1) {
      outbounds.push({
        type: "vless",
        tag: name + "-vless",
        server: addr,
        server_port: port,
        uuid: uuid,
        tls: { enabled: true, server_name: domain, utls: { enabled: true, fingerprint: "chrome" } },
        transport: { type: "ws", path: normPath(s.vlessPath || "/vless"), headers: { Host: domain } }
      });
    }

    if (s.protocols.indexOf("vmess") !== -1) {
      outbounds.push({
        type: "vmess",
        tag: name + "-vmess",
        server: addr,
        server_port: port,
        uuid: uuid,
        alter_id: 0,
        security: "auto",
        tls: { enabled: true, server_name: domain, utls: { enabled: true, fingerprint: "chrome" } },
        transport: { type: "ws", path: normPath(s.vmessPath || "/vmess"), headers: { Host: domain } }
      });
    }

    if (s.protocols.indexOf("trojan") !== -1) {
      outbounds.push({
        type: "trojan",
        tag: name + "-trojan",
        server: addr,
        server_port: port,
        password: uuid,
        tls: { enabled: true, server_name: domain, utls: { enabled: true, fingerprint: "chrome" } },
        transport: { type: "ws", path: normPath(s.trojanPath || "/trojan"), headers: { Host: domain } }
      });
    }

    if (s.protocols.indexOf("tuic") !== -1) {
      var tuicAddr = s.tuicAddr || domain;
      var tuicPort = parseInt(s.tuicPort || "443", 10);
      var tuicPass = s.tuicPass || uuid;
      outbounds.push({
        type: "tuic",
        tag: name + "-tuic",
        server: tuicAddr,
        server_port: tuicPort,
        uuid: uuid,
        password: tuicPass,
        congestion_control: "bbr",
        tls: { enabled: true, server_name: domain, alpn: ["h3"], insecure: true }
      });
    }

    if (s.protocols.indexOf("hysteria2") !== -1) {
      var hy2Addr = s.hy2Addr || domain;
      var hy2Port = parseInt(s.hy2Port || "8443", 10);
      var hy2Pass = s.hy2Pass || uuid;
      outbounds.push({
        type: "hysteria2",
        tag: name + "-hysteria2",
        server: hy2Addr,
        server_port: hy2Port,
        password: hy2Pass,
        tls: { enabled: true, server_name: domain, alpn: ["h3"], insecure: true }
      });
    }

    var tags = outbounds.map(function (o) { return o.tag; });

    var config = {
      log: { level: "info", timestamp: true },
      dns: {
        servers: [
          { tag: "google", address: "tls://8.8.8.8" },
          { tag: "local", address: "223.5.5.5", detour: "direct" }
        ],
        rules: [{ geosite: "cn", server: "local" }]
      },
      inbounds: [
        { type: "mixed", tag: "mixed-in", listen: "127.0.0.1", listen_port: 2080 }
      ],
      outbounds: outbounds.concat([
        {
          type: "selector",
          tag: "🦊 北极狐",
          outbounds: tags.concat(["direct"])
        },
        { type: "direct", tag: "direct" },
        { type: "block", tag: "block" }
      ]),
      route: {
        geoip: { path: "geoip.db" },
        geosite: { path: "geosite.db" },
        rules: [{ geosite: "cn", geoip: "cn", outbound: "direct" }],
        final: "🦊 北极狐"
      }
    };

    return JSON.stringify(config, null, 2);
  }

  // ==== Render ====
  function render(nodes) {
    var box = $("output");
    box.innerHTML = "";
    if (!nodes.length) {
      box.innerHTML = '<p style="color:var(--text-dim);text-align:center">' + t("toast_no_nodes") + '</p>';
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
        qrEl.textContent = "QR Error";
      }

      var copyBtn = node.querySelector(".copy");
      copyBtn.addEventListener("click", function () {
        copyText(n.link)
          .then(function () { toast(t("toast_copied") + " " + n.name, "ok"); })
          .catch(function () { toast(t("toast_fail"), "warn"); });
      });

      box.appendChild(node);
    });
  }

  // ==== Validate + Generate ====
  function generate() {
    var s = readState();
    if (!s.domain) { toast(t("toast_no_domain"), "warn"); $("domain").focus(); return null; }
    if (!s.uuid) { toast(t("toast_no_uuid"), "warn"); $("uuid").focus(); return null; }
    if (!s.protocols.length) { toast(t("toast_no_proto"), "warn"); return null; }
    s.lang = currentLang;
    persist(s);
    var nodes = buildLinks(s);
    render(nodes);
    return nodes;
  }

  // ==== Event Bindings ====
  function init() {
    restore();
    loadTheme();
    applyI18n();

    $("themeToggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(cur === "dark" ? "light" : "dark");
    });

    $("langToggle").addEventListener("click", function () {
      currentLang = currentLang === "zh" ? "en" : "zh";
      applyI18n();
      var s = readState();
      s.lang = currentLang;
      persist(s);
    });

    $("genUuid").addEventListener("click", function () {
      $("uuid").value = uuidv4();
      toast(t("toast_uuid"), "ok");
    });

    $("generate").addEventListener("click", generate);

    $("copyAll").addEventListener("click", function () {
      var nodes = generate();
      if (!nodes || !nodes.length) return;
      var all = nodes.map(function (n) { return n.link; }).join("\n");
      copyText(all)
        .then(function () { toast(t("toast_copied_all").replace("{n}", nodes.length), "ok"); })
        .catch(function () { toast(t("toast_fail"), "warn"); });
    });

    $("copySub").addEventListener("click", function () {
      var nodes = generate();
      if (!nodes || !nodes.length) return;
      var sub = utf8ToB64(nodes.map(function (n) { return n.link; }).join("\n"));
      copyText(sub)
        .then(function () { toast(t("toast_copied_sub"), "ok"); })
        .catch(function () { toast(t("toast_fail"), "warn"); });
    });

    $("copyClash").addEventListener("click", function () {
      var s = readState();
      if (!s.domain) { toast(t("toast_no_domain"), "warn"); $("domain").focus(); return; }
      if (!s.uuid) { toast(t("toast_no_uuid"), "warn"); $("uuid").focus(); return; }
      if (!s.protocols.length) { toast(t("toast_no_proto"), "warn"); return; }
      persist(s);
      var nodes = buildLinks(s);
      render(nodes);
      var yaml = buildClash(s, nodes);
      copyText(yaml)
        .then(function () { toast(t("toast_copied_clash"), "ok"); })
        .catch(function () { toast(t("toast_fail"), "warn"); });
    });

    $("copySingBox").addEventListener("click", function () {
      var s = readState();
      if (!s.domain) { toast(t("toast_no_domain"), "warn"); $("domain").focus(); return; }
      if (!s.uuid) { toast(t("toast_no_uuid"), "warn"); $("uuid").focus(); return; }
      if (!s.protocols.length) { toast(t("toast_no_proto"), "warn"); return; }
      persist(s);
      var nodes = buildLinks(s);
      render(nodes);
      var json = buildSingBox(s, nodes);
      copyText(json)
        .then(function () { toast(t("toast_copied_singbox"), "ok"); })
        .catch(function () { toast(t("toast_fail"), "warn"); });
    });

    document.querySelectorAll(".form-card input").forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); generate(); }
      });
    });

    var s = readState();
    if (s.domain && s.uuid) generate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
