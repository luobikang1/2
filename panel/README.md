# 🦊 白狐 可视化配置面板

> 输入隧道域名 + UUID → 一键生成 VLESS / VMess / Trojan / TUIC 节点 → 二维码 + 一键复制 + Base64 订阅

## 特性

- **纯前端**：所有数据仅保存在本地浏览器 localStorage，不经任何服务器
- **完美 TUIC 支持**：自动生成 TUIC 直连节点（QUIC/UDP/BBR）
- **二维码**：每个节点卡片自带二维码，手机扫码即用
- **一键复制**：单条复制 / 复制全部 / Base64 订阅格式
- **自动记忆**：刷新页面自动恢复上次配置

## 部署方式

| 平台 | 方式 |
|------|------|
| **GitHub Pages** | 已内置 `.github/workflows/deploy-panel-pages.yml`，推送到 `main` 自动部署 `panel/` |
| **Cloudflare Pages** | `npx wrangler pages deploy panel --project-name baihu-panel`；或在 Dashboard 连接仓库，构建输出目录填 `panel` |
| **Vercel** | 导入仓库，**Root Directory** 设为 `panel`，框架选 Other |
| **Netlify** | 连接仓库，Base/Publish 目录设为 `panel`；或把 `panel/` 拖到 [Netlify Drop](https://app.netlify.com/drop) |
| **任意静态托管** | 直接上传 `panel/` 目录下所有文件 |

## 本地预览

```bash
cd panel
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 技术栈

- 纯 HTML + CSS + JavaScript（ES5 兼容，无构建步骤）
- QRCode.js（内置 `js/qrcode.min.js`，离线可用）
- CSS Custom Properties + 毛玻璃效果 + 极光动画
