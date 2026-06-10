# Proxy Panel — 多协议代理节点可视化面板

> VLESS / VMess / Trojan / Hysteria2 / TUIC · 一键生成 · 二维码 · 订阅链接

## 功能

- **多协议支持**：VLESS（主推）、VMess、Trojan、Hysteria2、TUIC
- **一键生成**：输入域名，选择协议，自动配置所有参数
- **二维码 + 订阅链接**：每个节点自动生成 QR 码，支持 Base64 订阅导入客户端
- **Cloudflare 代理流量监控**：实时显示已用流量/上限/使用率
- **Cloudflare 免费套餐用量**：Pages/Workers/KV/R2/D1 额度可视化
- **密码保护**：可选加密面板访问
- **中英文切换**：完整国际化支持
- **多平台部署**：CF Pages / Vercel / Netlify / GitHub Pages / Docker
- **纯前端**：数据保存在 localStorage，无需后端

---

## 配置变量说明

### 面板密码 `PANEL_PASSWORD`

| 项目 | 说明 |
|------|------|
| **文件位置** | `js/app.js` 第 11 行 |
| **默认值** | `""` （空字符串，不启用密码） |
| **作用** | 设置后访问面板需输入密码才能查看内容 |
| **URL 自动解锁** | 支持 `?pass=你的密码` URL 参数直接解锁 |

```javascript
// js/app.js
var PANEL_PASSWORD = "";        // 留空 = 不启用密码保护
var PANEL_PASSWORD = "mypass";  // 设置密码
```

**使用方式：**
- 手动输入：访问面板 → 输入密码 → 解锁
- URL 参数：`https://your-domain.com/?pass=mypass` 自动解锁

---

### 存储键名（localStorage）

| 变量名 | 键名 | 说明 |
|--------|------|------|
| `STORAGE_KEY` | `proxy-panel-nodes-v2` | 节点数据存储 |
| `LANG_KEY` | `proxy-panel-lang` | 语言偏好（zh / en） |
| `CF_STORAGE_KEY` | `proxy-panel-cf-usage-v1` | Cloudflare 套餐用量数据 |
| `TRAFFIC_KEY` | `proxy-panel-traffic-v1` | 代理流量监控数据 |

---

### 部署平台环境变量

#### Cloudflare Pages

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PANEL_PASS` | 面板访问密码（可选） | `mypassword123` |

> 在 Cloudflare Pages → Settings → Environment variables 中设置

#### Vercel

在 `vercel.json` 中已配置输出目录为根目录。环境变量通过 Vercel Dashboard → Settings → Environment Variables 设置。

#### Netlify

在 `netlify.toml` 中已配置发布目录。环境变量通过 Netlify Dashboard → Site settings → Environment variables 设置。

---

### 节点配置参数

#### 一键生成参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 协议 | `vless` | 可选：vless / vmess / trojan / hysteria2 / tuic |
| 端口 | `443` | 默认 HTTPS 端口 |
| UUID | 自动生成 | 随机 UUID v4 |
| 传输层 | `ws` | WebSocket（兼容 Cloudflare） |
| TLS | `tls` | 启用 TLS 加密 |
| Path | 随机 | `/{8位随机字符}` |
| ALPN | `h2,http/1.1` | TUIC/Hysteria2 使用 `h3` |
| 允许不安全 | `0` | 不允许 |

#### 自定义配置参数

| 字段 | 必填 | 说明 |
|------|------|------|
| 协议类型 | ✓ | VLESS / VMess / Trojan / Hysteria2 / TUIC |
| 服务器地址 | ✓ | 域名或 IP |
| 端口 | ✓ | 服务器端口 |
| UUID / 密码 | ✓ | 认证凭据 |
| SNI / Host | × | 留空则使用服务器地址 |
| 节点名称 | × | 默认 `Proxy-Node` |
| 传输层 | × | WebSocket / gRPC / TCP / HTTP/2 |
| TLS | × | TLS / Reality / None |
| Path / ServiceName | × | WS path 或 gRPC service name |
| ALPN | × | h2,http/1.1 / h3 / h2 |
| 拥塞控制 | × | BBR / Cubic / New Reno（TUIC 专用） |
| 允许不安全 | × | Yes / No |

---

### 协议链接格式

| 协议 | 格式 |
|------|------|
| VLESS | `vless://uuid@server:port?encryption=none&type=ws&security=tls&sni=...#name` |
| VMess | `vmess://base64({v:2,ps:name,add:server,port:port,id:uuid,...})` |
| Trojan | `trojan://password@server:port?type=ws&security=tls&sni=...#name` |
| Hysteria2 | `hysteria2://password@server:port?sni=...&alpn=h3#name` |
| TUIC | `tuic://uuid:password@server:port?congestion_control=bbr&alpn=h3&sni=...#name` |

---

## 部署

### Cloudflare Pages（推荐）

1. Fork 本仓库
2. Cloudflare Dashboard → Workers & Pages → Create → 连接 GitHub
3. 输出目录：`/`（根目录）或 `panel`（如果在子目录）
4. （可选）设置环境变量 `PANEL_PASS` 启用密码保护
5. Deploy

### Vercel

1. Import Repository
2. Root Directory：根目录
3. Framework Preset：Other
4. Deploy

### Netlify

1. 连接 GitHub 仓库
2. Publish directory：根目录
3. Deploy

### GitHub Pages

1. Settings → Pages → Source: Deploy from branch
2. 选择 main 分支，目录 `/`

### Docker

```bash
docker run -d -p 8080:80 \
  -v $(pwd):/usr/share/nginx/html:ro \
  nginx:alpine
```

### 手动部署

将所有文件上传到任意 Web 服务器（Nginx / Apache / Caddy）的静态文件目录即可。

---

## 技术栈

- 纯 HTML / CSS / JavaScript（零依赖、零构建）
- QR 码生成：[qrcode.js](https://github.com/davidshimjs/qrcodejs)
- 国际化：`js/i18n.js` 字典 + `data-i18n` 属性
- 部署平台：Cloudflare Pages / Vercel / Netlify / GitHub Pages / Docker

## 文件结构

```
├── index.html          # 主页面
├── css/style.css       # 样式
├── js/
│   ├── app.js          # 核心逻辑（密码、协议、生成、流量）
│   ├── i18n.js         # 中英文翻译字典
│   └── qrcode.min.js   # QR 码生成库
├── _headers            # Cloudflare 安全头
├── _redirects          # SPA 路由
├── netlify.toml        # Netlify 配置
├── vercel.json         # Vercel 配置
└── wrangler.toml       # Cloudflare Workers 配置
```
