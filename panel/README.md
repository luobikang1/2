# TUIC Panel — 节点可视化面板

> TUIC 节点生成 · 二维码 · Base64 订阅链接 · 部署于 Cloudflare Pages

## 功能

- 输入 TUIC 节点参数（服务器、端口、UUID、密码、SNI 等）
- 一键生成 `tuic://` 协议链接
- 每个节点自动显示二维码，手机扫码即用
- 支持添加多个节点
- 自动生成 Base64 编码的订阅内容（兼容主流客户端）
- 复制单个节点链接 / 复制全部链接 / 复制订阅内容
- 高级选项：拥塞控制（BBR/Cubic/New Reno）、ALPN、UDP Relay Mode
- 数据保存在浏览器 localStorage，刷新不丢失
- 纯前端，无后端，隐私安全

## 部署

### Cloudflare Pages（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create
2. 选择 Pages → Upload assets
3. 将 `panel/` 目录内所有文件上传
4. 点击 Deploy

### GitHub Actions 自动部署

仓库已配置 `.github/workflows/deploy-panel-pages.yml`，push 到 main 分支后自动部署。

## 技术栈

- 纯 HTML / CSS / JavaScript（零依赖、零构建）
- QR 码生成：[qrcode.js](https://github.com/davidshimjs/qrcodejs)
- 部署平台：Cloudflare Pages / Vercel / Netlify / GitHub Pages
