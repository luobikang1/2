/* White Fox 白狐 — Link data & search engines */
window.ENGINES = [
  { id: "baidu",      name: "百度 / Baidu",   icon: "🔍", url: "https://www.baidu.com/s?wd={q}" },
  { id: "google",     name: "Google",          icon: "🌐", url: "https://www.google.com/search?q={q}" },
  { id: "github",     name: "GitHub",          icon: "🐱", url: "https://github.com/search?q={q}" },
  { id: "cloudflare", name: "Cloudflare",      icon: "☁️", url: "https://developers.cloudflare.com/?q={q}" },
];

/* Categories & links — each link: [name, url, desc_zh?, desc_en?] */
window.SITE_DATA = [
  /* ── Main search entry points ── */
  {
    cat: "cat_engines",
    emoji: "🔎",
    links: [
      ["百度 Baidu",            "https://www.baidu.com",                   "中文第一搜索引擎", "China's leading search engine"],
      ["Google",                "https://www.google.com",                  "全球最大搜索引擎", "World's largest search engine"],
      ["GitHub",                "https://github.com",                      "全球最大代码托管平台", "World's largest code hosting"],
      ["Cloudflare",            "https://dash.cloudflare.com",             "CDN、DNS 与安全服务", "CDN, DNS & security"],
      ["Bing",                  "https://www.bing.com",                    "微软搜索引擎", "Microsoft search engine"],
      ["DuckDuckGo",            "https://duckduckgo.com",                  "隐私优先的搜索引擎", "Privacy-focused search engine"],
    ],
  },

  /* ── Domain registration & DNS resolution ── */
  {
    cat: "cat_domain",
    emoji: "🌍",
    links: [
      ["Cloudflare Registrar",  "https://www.cloudflare.com/products/registrar/", "免费 DNS + 低价域名", "Free DNS + at-cost domains"],
      ["Namesilo",              "https://www.namesilo.com",                "便宜域名注册", "Affordable domain registrar"],
      ["Namecheap",             "https://www.namecheap.com",               "流行域名注册商", "Popular domain registrar"],
      ["GoDaddy",               "https://www.godaddy.com",                 "全球最大域名商", "World's largest registrar"],
      ["Alibaba Cloud DNS",     "https://wanwang.aliyun.com/domain",       "阿里云万网域名", "Alibaba Cloud domains"],
      ["DNSPod (Tencent)",      "https://www.dnspod.cn",                   "腾讯云 DNS 解析", "Tencent Cloud DNS"],
      ["Freenom (Archive)",     "https://www.freenom.com",                 "曾提供免费域名（已停止）", "Free domains (discontinued)"],
      ["EU.org",                "https://nic.eu.org",                      "免费 .eu.org 子域", "Free .eu.org subdomain"],
      ["US.KG",                 "https://nic.us.kg",                       "免费 .us.kg 域名", "Free .us.kg domain"],
      ["FreeDNS (afraid.org)",  "https://freedns.afraid.org",              "免费 DNS 托管", "Free DNS hosting"],
      ["deSEC",                 "https://desec.io",                        "免费安全 DNS", "Free secure DNS hosting"],
      ["Hurricane Electric DNS","https://dns.he.net",                      "免费 DNS 托管", "Free DNS hosting"],
      ["ClouDNS",               "https://www.cloudns.net",                 "免费 DNS 解析", "Free DNS hosting"],
      ["Gandi",                 "https://www.gandi.net",                   "域名 + 邮箱", "Domains & email"],
      ["Porkbun",               "https://porkbun.com",                     "低价优质域名", "Low-cost domains"],
    ],
  },

  /* ── Email login ── */
  {
    cat: "cat_email",
    emoji: "📧",
    links: [
      ["Gmail",                 "https://mail.google.com",                 "Google 邮箱", "Google email"],
      ["Outlook / Hotmail",     "https://outlook.live.com",                "微软邮箱", "Microsoft email"],
      ["QQ 邮箱",               "https://mail.qq.com",                     "腾讯 QQ 邮箱", "Tencent QQ mail"],
      ["163 网易邮箱",           "https://mail.163.com",                    "网易免费邮箱", "NetEase free email"],
      ["ProtonMail",            "https://mail.proton.me",                  "加密隐私邮箱", "Encrypted & private email"],
      ["Yahoo Mail",            "https://mail.yahoo.com",                  "雅虎邮箱", "Yahoo email"],
      ["iCloud Mail",           "https://www.icloud.com/mail",             "苹果邮箱", "Apple email"],
      ["Zoho Mail",             "https://mail.zoho.com",                   "免费企业邮箱", "Free business email"],
      ["Tutanota / Tuta",       "https://app.tuta.com",                    "加密邮箱", "Encrypted email"],
      ["Yandex Mail",           "https://mail.yandex.com",                 "Yandex 邮箱", "Yandex email"],
      ["Temp Mail",             "https://temp-mail.org",                   "临时邮箱", "Disposable email"],
    ],
  },

  /* ── Free servers / hosting ── */
  {
    cat: "cat_server",
    emoji: "🖥️",
    links: [
      ["Cloudflare Pages",      "https://pages.cloudflare.com",            "免费静态站托管", "Free static hosting"],
      ["Cloudflare Workers",    "https://workers.cloudflare.com",          "免费边缘函数", "Free edge functions"],
      ["Vercel",                "https://vercel.com",                      "免费前端部署", "Free frontend deploy"],
      ["Netlify",               "https://www.netlify.com",                 "免费 Jamstack 托管", "Free Jamstack hosting"],
      ["GitHub Pages",          "https://pages.github.com",                "免费静态网站", "Free static sites"],
      ["Railway",               "https://railway.app",                     "免费服务器试用", "Free server trial"],
      ["Render",                "https://render.com",                      "免费静态站 + 服务", "Free static + services"],
      ["Fly.io",                "https://fly.io",                          "全球边缘服务器", "Global edge servers"],
      ["Glitch",                "https://glitch.com",                      "免费 Node.js 托管", "Free Node.js hosting"],
      ["Replit",                "https://replit.com",                      "在线编程 + 免费托管", "Online IDE + free hosting"],
      ["Koyeb",                 "https://www.koyeb.com",                   "免费 Serverless", "Free serverless platform"],
      ["Serv00",                "https://www.serv00.com",                  "免费虚拟主机", "Free virtual hosting"],
      ["Oracle Cloud Free",     "https://www.oracle.com/cloud/free/",      "永久免费 VPS", "Always-free VPS"],
      ["AWS Free Tier",         "https://aws.amazon.com/free/",            "12 个月免费", "12-month free tier"],
      ["Google Cloud Free",     "https://cloud.google.com/free",           "免费试用", "Free tier"],
    ],
  },

  /* ── IP lookup ── */
  {
    cat: "cat_ip",
    emoji: "📡",
    links: [
      ["ip.sb",                 "https://ip.sb",                           "快速 IP 查询", "Fast IP lookup"],
      ["IPinfo.io",             "https://ipinfo.io",                       "IP 详细信息", "IP details"],
      ["ip138",                 "https://www.ip138.com",                   "IP 地址查询", "IP address lookup"],
      ["ip-api.com",            "https://ip-api.com",                      "IP 地理定位", "IP geolocation"],
      ["WhatIsMyIPAddress",     "https://whatismyipaddress.com",           "查看你的 IP", "See your IP"],
      ["IPLeak.net",            "https://ipleak.net",                      "IP / DNS 泄露检测", "IP / DNS leak test"],
      ["BrowserLeaks",          "https://browserleaks.com",                "浏览器隐私检测", "Browser privacy test"],
      ["ping.pe",               "https://ping.pe",                         "全球 Ping 测试", "Global ping test"],
      ["ITDOG",                 "https://www.itdog.cn",                    "国内 Ping / 路由追踪", "China ping & traceroute"],
      ["DNS Checker",           "https://dnschecker.org",                  "DNS 传播检测", "DNS propagation check"],
      ["Shodan",                "https://www.shodan.io",                   "IoT 搜索引擎", "IoT search engine"],
    ],
  },

  /* ── IT learning ── */
  {
    cat: "cat_learn",
    emoji: "📚",
    links: [
      ["MDN Web Docs",          "https://developer.mozilla.org",           "前端权威文档", "Web development docs"],
      ["W3Schools",             "https://www.w3schools.com",               "入门教程", "Beginner tutorials"],
      ["菜鸟教程 Runoob",       "https://www.runoob.com",                  "中文编程教程", "Chinese coding tutorials"],
      ["Stack Overflow",        "https://stackoverflow.com",               "程序员问答", "Developer Q&A"],
      ["freeCodeCamp",          "https://www.freecodecamp.org",            "免费编程课程", "Free coding courses"],
      ["LeetCode",              "https://leetcode.com",                    "算法练习", "Algorithm practice"],
      ["Coursera",              "https://www.coursera.org",                "名校在线课程", "University online courses"],
      ["GeeksforGeeks",         "https://www.geeksforgeeks.org",           "计算机科学教程", "CS tutorials"],
      ["掘金 Juejin",           "https://juejin.cn",                       "中文技术社区", "Chinese tech community"],
      ["CSDN",                  "https://www.csdn.net",                    "中文开发者社区", "Chinese developer community"],
      ["Bilibili",              "https://www.bilibili.com",                "学习视频", "Learning videos"],
      ["DevDocs",               "https://devdocs.io",                      "API 文档聚合", "API documentation aggregator"],
      ["Linux Command",         "https://www.linuxcool.com",               "Linux 命令大全", "Linux command reference"],
      ["Vue.js Docs",           "https://vuejs.org",                       "Vue 官方文档", "Vue official docs"],
      ["React Docs",            "https://react.dev",                       "React 官方文档", "React official docs"],
      ["Cloudflare Docs",       "https://developers.cloudflare.com",       "Cloudflare 文档", "Cloudflare documentation"],
    ],
  },
];
