# 🦊 白狐 White Fox

> 聚合搜索与上网导航起始页 — Aggregated search & web navigation start page

![License](https://img.shields.io/badge/license-MIT-blue)
![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange)

## ✨ 功能 / Features

| 功能 | Feature |
|------|---------|
| 🔎 聚合搜索：百度、Google、GitHub、Cloudflare | Multi-engine search: Baidu, Google, GitHub, Cloudflare |
| 🌍 域名注册与 DNS 解析导航 | Domain registration & DNS resolution links |
| 📧 主流邮箱登录快捷入口 | Quick access to popular email services |
| 🖥️ 免费服务器 / 托管平台导航 | Free server & hosting platform navigation |
| 📡 IP 查询工具集 | IP lookup tool collection |
| 📚 IT 技术学习资源 | IT learning resources |
| ⭐ 书签管理（浏览器本地存储） | Bookmark management (localStorage) |
| 🕓 搜索历史记录 | Search history |
| 🎨 可调背景颜色 / 深浅主题 | Adjustable background color / light & dark theme |
| 🌐 多语言支持（中文/English/繁體/日本語/Español） | Multi-language support |

## 🚀 部署 / Deploy

### Cloudflare Pages（推荐 / Recommended）

**方法 1 — 直接上传：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. 选择 **Pages** → **Upload assets**
3. 项目名填 `white-fox`，将所有文件拖入上传
4. 点击 **Deploy**

**方法 2 — GitHub 自动部署：**
1. Fork 本仓库
2. 在 Cloudflare Dashboard 创建 Pages 项目，连接你的 GitHub 仓库
3. 构建命令留空，输出目录填 `.`
4. 或者：在仓库 Settings → Secrets 添加 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，GitHub Actions 会自动部署

**方法 3 — Wrangler CLI：**
```bash
npx wrangler pages deploy . --project-name white-fox
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USER/white-fox)

1. 点击上方按钮 / Click button above
2. 或：`npx vercel --prod`

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. 拖拽文件夹到 [Netlify Drop](https://app.netlify.com/drop)
2. 或连接 GitHub 仓库，Publish directory 填 `.`

### GitHub Pages

1. Settings → Pages → Source: Deploy from branch → `main` / `root`
2. 自动可用于 `https://YOUR_USER.github.io/white-fox/`

### 其他平台 / Other Platforms

本项目是纯静态 HTML/CSS/JS，无需构建步骤。将全部文件上传至任何静态网站托管即可。

This is a pure static HTML/CSS/JS project with zero build steps. Upload all files to any static hosting provider.

## 📁 项目结构 / Structure

```
white-fox/
├── index.html             # 入口 / Entry
├── css/style.css          # 样式 / Styles
├── js/
│   ├── i18n.js            # 国际化 / Translations
│   ├── data.js            # 导航数据 / Site links
│   └── app.js             # 应用逻辑 / App logic
├── _headers               # Cloudflare Pages headers
├── _redirects              # Cloudflare Pages redirects
├── wrangler.toml           # Wrangler CLI config
├── netlify.toml            # Netlify config
├── vercel.json             # Vercel config
├── .github/workflows/
│   └── deploy-cloudflare.yml  # GitHub Actions → CF Pages
└── README.md
```

## 🛠️ 自定义 / Customization

- **添加链接**：编辑 `js/data.js`，在对应分类的 `links` 数组中添加 `[名称, URL, 中文描述, 英文描述]`
- **添加语言**：编辑 `js/i18n.js`，在 `langs` 数组中注册新语言代码，然后添加翻译对象
- **添加搜索引擎**：编辑 `js/data.js` 的 `ENGINES` 数组，`{q}` 占位搜索词

## 📄 License

MIT
