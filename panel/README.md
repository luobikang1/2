# 北极狐 Proxy Panel — Cloudflare 节点服务器 + 可视化面板

> Cloudflare 作为节点服务器，域名只需有 DNS 解析或 CDN 即可实现翻墙 · 中国大陆可连接 Google 等外网

## 核心原理

```
用户客户端 → Cloudflare CDN（全球节点） → Pages Functions（VLESS 代理） → 目标网站（Google 等）
```

**只要你的域名能解析到 Cloudflare（DNS 或 CDN），就能作为 VPN 节点使用。** Cloudflare 免费套餐即可。

## 功能

- **Cloudflare 即节点服务器**：域名只需 DNS 解析到 CF 或使用 CDN，即可代理访问外网
- **一键生成 10 个节点**：自动使用 Cloudflare 支持的 6 个 HTTPS 端口轮换（443/8443/2053/2083/2087/2096）
- **订阅链接即时输出**：生成节点同时输出 Base64 + sing-box 两种格式订阅
- **sing-box 内核支持**：完整 JSON 配置（含 DNS/路由/自动选择/国内直连规则）
- **内置 VLESS 代理**：Cloudflare Pages Functions 自带 VLESS WebSocket 代理，部署即用
- **二维码 + 订阅链接**：每个节点自动生成 QR 码
- **Cloudflare 代理流量监控**：实时显示已用流量/上限/使用率
- **Cloudflare 免费套餐用量**：Pages/Workers/KV/R2/D1 额度可视化
- **登录验证**：UUID + 绑定域名方式验证身份，支持环境变量/KV/D1 三种配置
- **中英文切换**：完整国际化支持
- **多平台部署**：CF Pages / Vercel / Netlify / GitHub Pages / Docker
- **纯前端 + 可选 Functions**：无登录凭据时直接访问，有凭据时通过 Pages Functions 验证

---

## 配置变量说明

### 登录验证（UUID + 绑定域名）

面板支持通过 UUID 和绑定域名进行登录验证。设置后，用户需输入正确的 UUID 和域名才能访问操作界面。**不设置则不需要登录，可直接访问。**

#### 配置方式（优先级从高到低）

| 方式 | 配置方法 | 说明 |
|------|----------|------|
| **环境变量** | 设置 `LOGIN_UUID` + `LOGIN_DOMAIN` | 推荐，最简单 |
| **KV 存储** | 绑定 `PANEL_KV`，写入 key `login_uuid` 和 `login_domain` | 适合多项目共享 |
| **D1 数据库** | 绑定 `PANEL_DB`，建表写入两条记录 | 适合动态修改 |
| **客户端回退** | `js/app.js` 中设置 `LOGIN_UUID` 和 `LOGIN_DOMAIN` | 仅纯静态部署 |

#### 环境变量方式（推荐）

1. Cloudflare Pages → Settings → Environment variables
2. 添加两个变量：
   - `LOGIN_UUID` = 你的 UUID（如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`）
   - `LOGIN_DOMAIN` = 绑定的域名（如 `proxy.example.com`）
3. 重新部署生效

#### KV 方式

1. Cloudflare Dashboard → KV → 创建 Namespace（如 `proxy-panel-kv`）
2. Pages → Settings → Functions → KV namespace bindings → 变量名：`PANEL_KV`
3. 在 KV 中写入两个 key：
   - `login_uuid` = 你的 UUID
   - `login_domain` = 你的域名

#### D1 方式

1. Cloudflare Dashboard → D1 → 创建数据库（如 `proxy-panel-db`）
2. 执行 SQL：
   ```sql
   CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
   INSERT INTO config (key, value) VALUES ('login_uuid', '你的UUID');
   INSERT INTO config (key, value) VALUES ('login_domain', '你的域名');
   ```
3. Pages → Settings → Functions → D1 database bindings → 变量名：`PANEL_DB`

#### 客户端回退（纯静态部署）

```javascript
// js/app.js 第 17-18 行
var LOGIN_UUID = "your-uuid-here";
var LOGIN_DOMAIN = "your-domain.com";
```

> 注意：客户端凭据可被查看源码获取，仅适用于简单场景。生产环境建议使用环境变量/KV/D1。

#### URL 参数自动登录

所有方式均支持 URL 参数直接登录：`https://your-domain.com/?uuid=xxx&domain=yyy`

---

### Cloudflare Pages Functions 绑定

| 绑定类型 | 变量名 | 说明 |
|----------|--------|------|
| 环境变量 | `LOGIN_UUID` | 登录 UUID |
| 环境变量 | `LOGIN_DOMAIN` | 登录绑定域名 |
| KV Namespace | `PANEL_KV` | 存储登录凭据的 KV 命名空间 |
| D1 Database | `PANEL_DB` | 存储登录凭据的 D1 数据库 |

设置位置：Cloudflare Pages → Settings → Functions

---

### API 端点（Pages Functions 自动提供）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config` | GET | 返回 `{ "protected": true/false }`，告知前端是否需要登录 |
| `/api/login` | POST | Body: `{ "uuid": "xxx", "domain": "yyy" }`，返回 `{ "ok": true/false }` |

> 如果不是部署在 Cloudflare Pages（如纯 Nginx），这两个端点不存在，前端自动回退到客户端 `LOGIN_UUID` / `LOGIN_DOMAIN` 验证。

---

### 存储键名（localStorage / sessionStorage）

| 变量名 | 键名 | 存储位置 | 说明 |
|--------|------|----------|------|
| `STORAGE_KEY` | `proxy-panel-nodes-v2` | localStorage | 节点数据 |
| `LANG_KEY` | `proxy-panel-lang` | localStorage | 语言偏好（zh / en） |
| `CF_STORAGE_KEY` | `proxy-panel-cf-usage-v1` | localStorage | Cloudflare 套餐用量 |
| `TRAFFIC_KEY` | `proxy-panel-traffic-v1` | localStorage | 代理流量监控数据 |
| `AUTH_KEY` | `proxy-panel-auth-v1` | sessionStorage | 当前会话登录状态 |

---

### 节点配置参数

#### 一键生成默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 协议 | `vless` | 可选：vless / vmess / trojan / hysteria2 / tuic |
| 端口 | `443` | HTTPS 端口 |
| UUID | 自动生成 | `crypto.randomUUID()` |
| 传输层 | `ws` | WebSocket（Cloudflare 兼容） |
| TLS | `tls` | 启用加密 |
| Path | 随机 8 位 | `/{randomUUID().slice(0,8)}` |
| ALPN | `h2,http/1.1` | TUIC/Hysteria2 自动使用 `h3` |
| 允许不安全 | `0`（No） | 不跳过证书验证 |

#### 自定义配置字段

| 字段 | 必填 | 说明 |
|------|------|------|
| 协议类型 | ✓ | VLESS / VMess / Trojan / Hysteria2 / TUIC |
| 服务器地址 | ✓ | 域名或 IP |
| 端口 | ✓ | 服务端口（默认 443） |
| UUID / 密码 | ✓ | 节点认证凭据 |
| SNI / Host | × | TLS SNI，留空 = 服务器地址 |
| 节点名称 | × | 显示名称，默认 `Proxy-Node` |
| 传输层 | × | WebSocket / gRPC / TCP / HTTP/2 |
| TLS | × | TLS / Reality / None |
| Path / ServiceName | × | WS path 或 gRPC service name |
| ALPN | × | h2,http/1.1 / h3 / h2 |
| 拥塞控制 | × | BBR / Cubic / New Reno（TUIC/Hysteria2） |
| 允许不安全 | × | Yes / No |

---

### 协议链接格式

| 协议 | 格式 |
|------|------|
| VLESS | `vless://uuid@server:port?encryption=none&type=ws&security=tls&sni=...#name` |
| VMess | `vmess://base64({v:2, ps:name, add:server, port:port, id:uuid, ...})` |
| Trojan | `trojan://password@server:port?type=ws&security=tls&sni=...#name` |
| Hysteria2 | `hysteria2://password@server:port?sni=...&alpn=h3#name` |
| TUIC | `tuic://uuid:password@server:port?congestion_control=bbr&alpn=h3&sni=...#name` |

---

## VLESS 代理（节点连通）

本项目内置 VLESS WebSocket 代理功能。部署到 Cloudflare Pages 后，只需设置 `UUID` 环境变量，节点即可连通。**中国大陆可直接连接 Google、YouTube 等外网。**

### 连通步骤

1. **部署到 Cloudflare Pages**（见下方部署说明）
2. **设置环境变量 `UUID`** = 你生成的 UUID（一键生成后面板会显示）
3. **绑定自定义域名**（推荐）或使用 Pages 默认 `.pages.dev` 域名
4. **在面板输入域名，点击一键生成** — 自动生成 10 个节点 + 订阅链接
5. **复制订阅链接导入客户端** — 支持 Base64（v2rayN/Clash）和 sing-box JSON 两种格式

### 一键生成说明

- 自动生成 10 个 VLESS 节点，使用 Cloudflare 支持的 6 个 HTTPS 端口轮换
- 端口：443、8443、2053、2083、2087、2096
- 同时输出 Base64 订阅（兼容 v2rayN / Clash / Shadowrocket）和 sing-box 完整配置
- sing-box 配置含：selector 手动选择 + urltest 自动测速 + 国内直连规则

### 工作原理

```
客户端 (VLESS/WS/TLS)  →  Cloudflare CDN  →  Pages Functions (_middleware.js)  →  目标网站
```

- `_middleware.js` 拦截非静态请求，验证 VLESS 协议中的 UUID
- 验证通过后建立 TCP 连接到目标地址
- 所有流量经过 Cloudflare CDN，享受全球加速

### 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `UUID` | ✓（代理功能必须） | VLESS 节点的 UUID，生成节点时使用的同一个 UUID |
| `LOGIN_UUID` | × | 面板登录用的 UUID（可与 UUID 不同） |
| `LOGIN_DOMAIN` | × | 面板登录用的绑定域名 |

> **重要**：`UUID` 环境变量是代理连通的核心。面板一键生成节点后，把显示的 UUID 设为此环境变量的值。

### 支持的客户端

| 客户端 | 平台 | 订阅格式 | 推荐 |
|--------|------|----------|------|
| sing-box | 全平台 | sing-box JSON | ★★★★ |
| NekoBox / NekoRay | Windows/Android | sing-box JSON / Base64 | ★★★★ |
| v2rayN 6.x+ | Windows | Base64 | ★★★ |
| Clash Verge / Meta | Windows/macOS/Linux | Base64 | ★★★ |
| Shadowrocket | iOS | Base64 | ★★★ |
| Quantumult X | iOS | Base64 | ★★ |

---

## 部署

### Cloudflare Pages（推荐）

1. Fork 本仓库
2. Cloudflare Dashboard → Workers & Pages → Create → 连接 GitHub
3. 构建设置：
   - 输出目录：`panel`（如果在子目录）或 `/`（如果在根目录）
   - 无需构建命令
4. Settings → Environment variables：
   - `UUID` = 你的代理 UUID（**必须设置才能连通节点**）
   - `LOGIN_UUID` = 面板登录 UUID（可选）
   - `LOGIN_DOMAIN` = 面板登录域名（可选）
5. Deploy
6. （可选）Custom domains → 绑定自定义域名

### Vercel

1. Import Repository
2. Root Directory：`panel`（或根目录）
3. Framework Preset：Other
4. Deploy

> Vercel 不支持 Pages Functions，登录验证需在 `js/app.js` 中设置 `LOGIN_UUID` 和 `LOGIN_DOMAIN`

### Netlify

1. 连接 GitHub 仓库
2. Publish directory：`panel`（或根目录）
3. Deploy

> Netlify 不支持 Pages Functions，登录验证需在 `js/app.js` 中设置

### GitHub Pages

1. Settings → Pages → Source: Deploy from branch
2. 选择 main 分支，目录 `/`（或 `/panel`）

### Docker

```bash
docker run -d -p 8080:80 \
  -v $(pwd)/panel:/usr/share/nginx/html:ro \
  nginx:alpine
```

### 手动部署

将文件上传到 Nginx / Apache / Caddy 静态文件目录即可。

---

## 文件结构

```
├── index.html              # 主页面
├── css/style.css           # 样式
├── js/
│   ├── app.js              # 核心逻辑（登录验证、协议生成、流量监控）
│   ├── i18n.js             # 中英文翻译字典
│   └── qrcode.min.js       # QR 码生成库
├── functions/
│   ├── _middleware.js      # VLESS WebSocket 代理核心（拦截非静态请求）
│   └── api/
│       ├── config.js       # GET /api/config — 返回是否需要登录
│       └── login.js        # POST /api/login — 验证 UUID + 域名
├── _headers                # Cloudflare 安全头
├── _redirects              # SPA 路由
├── netlify.toml            # Netlify 配置
├── vercel.json             # Vercel 配置
└── wrangler.toml           # Cloudflare Workers 配置
```

## 技术栈

- 纯 HTML / CSS / JavaScript（零构建）
- Cloudflare Pages Functions（VLESS 代理 + 登录验证）
- VLESS over WebSocket + TLS（Cloudflare CDN 加速）
- QR 码：[qrcode.js](https://github.com/davidshimjs/qrcodejs)
- i18n：`data-i18n` 属性 + 字典

## 常见问题

### 节点无法连通？

1. **检查 UUID**：确保 Cloudflare Pages 环境变量 `UUID` 设置正确，且与客户端节点的 UUID 一致
2. **检查域名**：节点服务器地址必须是你部署的 Pages 域名（`.pages.dev` 或自定义域名）
3. **协议选择**：推荐使用 VLESS + WebSocket + TLS（默认配置）
4. **端口**：Cloudflare 支持的端口为 443（默认）、8443、2053、2083、2087、2096
5. **路径**：VLESS 节点的 path 填 `/{uuid}`（面板自动生成）
6. **客户端版本**：确保客户端支持 VLESS 协议（v2rayN 6.x+, NekoBox, Shadowrocket 等）

### Vercel / Netlify 能否代理？

不能。Vercel 和 Netlify 不支持 WebSocket 长连接和 TCP connect，代理功能仅 Cloudflare Pages 支持。其他平台只能使用面板的节点管理功能。
