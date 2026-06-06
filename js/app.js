/* ======================================================
   White Fox 白狐 — Main application
   ====================================================== */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const LS = {
    get(k, def) { try { return JSON.parse(localStorage.getItem("wf_" + k)) ?? def; } catch { return def; } },
    set(k, v) { localStorage.setItem("wf_" + k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem("wf_" + k); },
  };

  /* ---------- State ---------- */
  const SWATCHES = ["#5b8def","#8b5cf6","#ec4899","#ef4444","#f59e0b","#22c55e","#14b8a6","#6366f1","#0ea5e9","#64748b"];
  let lang      = LS.get("lang", "zh");
  let theme     = LS.get("theme", "light");
  let accentHex = LS.get("accent", SWATCHES[0]);
  let engineId  = LS.get("engine", "baidu");
  let bookmarks = LS.get("bookmarks", []);
  let history   = LS.get("history", []);

  /* ---------- i18n ---------- */
  function t(key) {
    return (window.I18N[lang] || window.I18N["zh"])[key] || window.I18N["zh"][key] || key;
  }

  function applyI18n() {
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    $$("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.documentElement.lang = lang.startsWith("zh") ? "zh-CN" : lang;
    $("#langLabel").textContent = (window.I18N.langs.find(l => l.code === lang) || {}).label || lang;
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function applyAccent() {
    document.documentElement.style.setProperty("--accent", accentHex);
    const r = parseInt(accentHex.slice(1, 3), 16);
    const g = parseInt(accentHex.slice(3, 5), 16);
    const b = parseInt(accentHex.slice(5, 7), 16);
    document.documentElement.style.setProperty("--accent-light", `rgba(${r},${g},${b},.25)`);
  }

  /* ---------- Search engines ---------- */
  function renderEngines() {
    const tabs = $("#engineTabs");
    tabs.innerHTML = "";
    window.ENGINES.forEach(e => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "engine-tab" + (e.id === engineId ? " active" : "");
      btn.textContent = e.icon + " " + e.name;
      btn.setAttribute("role", "tab");
      btn.addEventListener("click", () => { engineId = e.id; LS.set("engine", engineId); renderEngines(); });
      tabs.appendChild(btn);
    });
  }

  function doSearch(query) {
    if (!query.trim()) return;
    const eng = window.ENGINES.find(e => e.id === engineId) || window.ENGINES[0];
    const url = eng.url.replace("{q}", encodeURIComponent(query.trim()));
    addHistory(query.trim(), eng.id);
    window.open(url, "_blank", "noopener");
  }

  /* ---------- Categories / links ---------- */
  function renderCategories() {
    const wrap = $("#categories");
    wrap.innerHTML = "";
    window.SITE_DATA.forEach(cat => {
      const sec = document.createElement("section");
      sec.className = "cards-section";
      const head = document.createElement("div");
      head.className = "section-head";
      head.innerHTML = `<h2 class="section-title"><span aria-hidden="true">${cat.emoji}</span> <span>${t(cat.cat)}</span></h2>`;
      sec.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "cards";
      cat.links.forEach(link => {
        const a = document.createElement("a");
        a.className = "card";
        a.href = link[1];
        a.target = "_blank";
        a.rel = "noopener";
        const desc = lang.startsWith("zh") || lang === "ja" ? (link[2] || "") : (link[3] || link[2] || "");
        a.innerHTML = `<span class="card-name">${link[0]}</span><span class="card-desc">${desc}</span>`;
        grid.appendChild(a);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  /* ---------- Bookmarks ---------- */
  function renderBookmarks() {
    const grid = $("#bookmarksGrid");
    const empty = $("#bookmarksEmpty");
    grid.innerHTML = "";
    if (!bookmarks.length) {
      grid.appendChild(empty);
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    bookmarks.forEach((bm, i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = bm.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `<span class="card-name">${esc(bm.name)}</span><span class="card-desc">${esc(bm.url)}</span>
        <button class="remove-bm" type="button" title="${t("remove")}" data-idx="${i}">&times;</button>`;
      a.querySelector(".remove-bm").addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        bookmarks.splice(i, 1);
        LS.set("bookmarks", bookmarks);
        renderBookmarks();
      });
      grid.appendChild(a);
    });
  }

  /* ---------- History ---------- */
  function addHistory(query, engId) {
    history = history.filter(h => !(h.q === query && h.e === engId));
    history.unshift({ q: query, e: engId, ts: Date.now() });
    if (history.length > 50) history = history.slice(0, 50);
    LS.set("history", history);
    renderHistory();
  }

  function renderHistory() {
    const list = $("#historyList");
    const empty = $("#historyEmpty");
    list.innerHTML = "";
    if (!history.length) { empty.hidden = false; return; }
    empty.hidden = true;
    history.forEach((h, i) => {
      const li = document.createElement("li");
      const eng = window.ENGINES.find(e => e.id === h.e) || window.ENGINES[0];
      li.innerHTML = `<span class="engine-badge">${eng.icon}</span><span>${esc(h.q)}</span>
        <button class="remove-hist" type="button" title="${t("remove")}" data-idx="${i}">&times;</button>`;
      li.addEventListener("click", ev => {
        if (ev.target.closest(".remove-hist")) return;
        engineId = h.e;
        LS.set("engine", engineId);
        renderEngines();
        doSearch(h.q);
      });
      li.querySelector(".remove-hist").addEventListener("click", ev => {
        ev.stopPropagation();
        history.splice(i, 1);
        LS.set("history", history);
        renderHistory();
      });
      list.appendChild(li);
    });
  }

  /* ---------- Settings drawer ---------- */
  function openSettings() {
    const d = $("#settingsDrawer");
    const o = $("#overlay");
    d.hidden = false; o.hidden = false;
    requestAnimationFrame(() => d.classList.add("open"));
  }
  function closeSettings() {
    const d = $("#settingsDrawer");
    d.classList.remove("open");
    setTimeout(() => { d.hidden = true; $("#overlay").hidden = true; }, 300);
  }

  function renderSettings() {
    // Language select
    const ls = $("#langSelect");
    ls.innerHTML = "";
    window.I18N.langs.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.code; opt.textContent = l.label;
      if (l.code === lang) opt.selected = true;
      ls.appendChild(opt);
    });

    // Theme seg
    $$("#themeSeg button").forEach(b => {
      b.classList.toggle("active", b.dataset.mode === theme);
    });

    // Swatches
    const sw = $("#swatches");
    sw.innerHTML = "";
    SWATCHES.forEach(hex => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch" + (hex === accentHex ? " active" : "");
      btn.style.background = hex;
      btn.addEventListener("click", () => {
        accentHex = hex; LS.set("accent", hex); applyAccent(); renderSettings();
      });
      sw.appendChild(btn);
    });
    $("#bgColorPicker").value = accentHex;

    // Default engine select
    const des = $("#defaultEngineSelect");
    des.innerHTML = "";
    window.ENGINES.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id; opt.textContent = e.icon + " " + e.name;
      if (e.id === engineId) opt.selected = true;
      des.appendChild(opt);
    });
  }

  /* ---------- Bookmark modal ---------- */
  function showBookmarkModal() { $("#bookmarkModal").hidden = false; }
  function hideBookmarkModal() {
    $("#bookmarkModal").hidden = true;
    $("#bookmarkForm").reset();
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---------- Wire up ---------- */
  function init() {
    applyTheme();
    applyAccent();
    renderEngines();
    renderCategories();
    renderBookmarks();
    renderHistory();
    renderSettings();
    applyI18n();

    // Search
    $("#searchForm").addEventListener("submit", ev => {
      ev.preventDefault();
      doSearch($("#searchInput").value);
    });

    // Settings open/close
    $("#settingsBtn").addEventListener("click", openSettings);
    $("#closeSettings").addEventListener("click", closeSettings);
    $("#overlay").addEventListener("click", closeSettings);

    // Language quick-toggle
    let langIdx = window.I18N.langs.findIndex(l => l.code === lang);
    $("#langBtn").addEventListener("click", () => {
      langIdx = (langIdx + 1) % window.I18N.langs.length;
      lang = window.I18N.langs[langIdx].code;
      LS.set("lang", lang);
      applyI18n();
      renderCategories();
      renderBookmarks();
      renderHistory();
      renderSettings();
    });

    // Theme segment
    $$("#themeSeg button").forEach(b => {
      b.addEventListener("click", () => {
        theme = b.dataset.mode; LS.set("theme", theme);
        applyTheme(); renderSettings();
      });
    });

    // Theme quick-toggle
    $("#themeBtn").addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      LS.set("theme", theme); applyTheme(); renderSettings();
    });

    // Color picker
    $("#bgColorPicker").addEventListener("input", ev => {
      accentHex = ev.target.value; LS.set("accent", accentHex);
      applyAccent(); renderSettings();
    });

    // Language select in drawer
    $("#langSelect").addEventListener("change", ev => {
      lang = ev.target.value; LS.set("lang", lang);
      applyI18n(); renderCategories(); renderBookmarks(); renderHistory(); renderSettings();
    });

    // Default engine select
    $("#defaultEngineSelect").addEventListener("change", ev => {
      engineId = ev.target.value; LS.set("engine", engineId); renderEngines();
    });

    // Reset
    $("#resetBtn").addEventListener("click", () => {
      ["lang","theme","accent","engine","bookmarks","history"].forEach(k => LS.del(k));
      lang = "zh"; theme = "light"; accentHex = SWATCHES[0]; engineId = "baidu";
      bookmarks = []; history = [];
      applyTheme(); applyAccent(); renderEngines(); renderCategories();
      renderBookmarks(); renderHistory(); renderSettings(); applyI18n();
    });

    // Bookmark modal
    $("#addBookmarkBtn").addEventListener("click", showBookmarkModal);
    $("#bmCancel").addEventListener("click", hideBookmarkModal);
    $("#bookmarkModal").addEventListener("click", ev => { if (ev.target === ev.currentTarget) hideBookmarkModal(); });
    $("#bookmarkForm").addEventListener("submit", ev => {
      ev.preventDefault();
      const name = $("#bmName").value.trim();
      const url = $("#bmUrl").value.trim();
      if (!name || !url) return;
      bookmarks.push({ name, url });
      LS.set("bookmarks", bookmarks);
      renderBookmarks();
      hideBookmarkModal();
    });

    // Clear history
    $("#clearHistoryBtn").addEventListener("click", () => {
      history = []; LS.set("history", history); renderHistory();
    });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
