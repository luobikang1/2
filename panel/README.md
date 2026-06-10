# 北极狐 Proxy Panel — 多协议代理节点可视化面板

> VLESS / VMess / Trojan / Hysteria2 / TUIC · 一键生成 · 二维码 · 订阅链接

## 功能

- **多协议支持**：VLESS（主推）、VMess、Trojan、Hysteria2、TUIC
- **一键生成**：输入域名，选择协议，自动配置所有参数
- **二维码 + 订阅链接**：每个节点自动生成 QR 码，支持 Base64 订阅导入客户端
- **Cloudflare 代理流量监控**：实时显示已用流量/上限/使用率
- **Cloudflare 免费套餐用量**：Pages/Workers/KV/R2/D1 额度可视化
- **密码保护**：支持 D1/KV/环境变量 三种方式设密码，服务端验证
- **中英文切换**：完整国际化支持
- **多平台部署**：CF Pages / Vercel / Netlify / GitHub Pages / Docker
- **纯前端 + 可选 Functions**：无密码时零后端，有密码时通过 Pages Functions 验证

---

## 配置变量说明

### 密码保护（三种方式，优先级从高到低）

| 方式 | 配置方法 | 说明 |
|------|----------|------|
| **环境变量** | Cloudflare Pages → Settings → 添加 `PANEL_PASS` | 推荐，最简单 |
| **KV 存储** | 创建 KV Namespace，绑定为 `PANEL_KV`，写入 key=`panel_pass` | 适合多项目共享密码 |
| **D1 数据库** | 创建 D1，绑定为 `PANEL_DB`，建表 `config(key, value)` 插入 `panel_pass` | 适合需要动态修改密码 |
| **客户端回退** | `js/app.js` 第 14 行 `PANEL_PASSWORD = "xxx"` | 仅纯静态部署时使用 |

#### 环境变量方式（推荐）

1. Cloudflare Pages → Settings → Environment variables
2. 添加变量 `PANEL_PASS`，值为你的密码
3. 重新部署生效

#### KV 方式

1. Cloudflare Dashboard → KV → 创建 Namespace（如 `proxy-panel-kv`）
2. Pages → Settings → Functions → KV namespace bindings → 变量名：`PANEL_KV`
3. 在 KV 中写入：key = `panel_pass`，value = 你的密码

#### D1 方式

1. Cloudflare Dashboard → D1 → 创建数据库（如 `proxy-panel-db`）
2. 执行 SQL：
   ```sql
   CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
   INSERT INTO config (key, value) VALUES ('panel_pass', '你的密码');
   ```
3. Pages → Settings → Functions → D1 database bindings → 变量名：`PANEL_DB`

#### 客户端回退（纯静态部署）

```javascript
// js/app.js 第 14 行
var PANEL_PASSWORD = "mypass";  // 仅无 Functions 环境时生效
```

> 注意：客户端密码可被用户通过查看源码获取，仅适用于简单场景。生产环境建议使用环境变量/KV/D1。

#### URL 参数自动解锁

所有密码方式均支持：`https://your-domain.com/?pass=你的密码`

---

### Cloudflare Pages Functions 绑定

| 绑定类型 | 变量名 | 说明 |
|----------|--------|------|
| 环境变量 | `PANEL_PASS` | 面板密码（字符串） |
| KV Namespace | `PANEL_KV` | 存储密码的 KV 命名空间 |
| D1 Database | `PANEL_DB` | 存储密码的 D1 数据库 |

设置位置：Cloudflare Pages → Settings → Functions

---

### API 端点（Pages Functions 自动提供）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/config` | GET | 返回 `{ "protected": true/false }`，告知前端是否需要密码 |
| `/api/login` | POST | Body: `{ "password": "xxx" }`，返回 `{ "ok": true/false }` |

> 如果未部署到 Cloudflare Pages（如纯静态 Nginx），这两个端点不存在，前端自动回退到客户端 `PANEL_PASSWORD` 验证。

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

## 部署

### Cloudflare Pages（推荐）

1. Fork 本仓库
2. Cloudflare Dashboard → Workers & Pages → Create → 连接 GitHub
3. 构建设置：
   - 输出目录：`panel`（如果在子目录）或 `/`（如果在根目录）
   - 无需构建命令
4. （可选）Settings → Functions → 添加绑定：
   - 环境变量：`PANEL_PASS` = 你的密码
   - 或 KV/D1 绑定（见上方说明）
5. Deploy

### Vercel

1. Import Repository
2. Root Directory：`panel`（或根目录）
3. Framework Preset：Other
4. Deploy

> Vercel 不支持 Pages Functions，密码保护需使用客户端 `PANEL_PASSWORD`

### Netlify

1. 连接 GitHub 仓库
2. Publish directory：`panel`（或根目录）
3. Deploy

> Netlify 不支持 Pages Functions，密码保护需使用客户端 `PANEL_PASSWORD`

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
│   ├── app.js              # 核心逻辑（密码验证、协议生成、流量监控）
│   ├── i18n.js             # 中英文翻译字典
│   └── qrcode.min.js       # QR 码生成库
├── functions/
│   └── api/
│       ├── config.js       # GET /api/config — 返回是否启用密码
│       └── login.js        # POST /api/login — 验证密码
├── _headers                # Cloudflare 安全头
├── _redirects              # SPA 路由
├── netlify.toml            # Netlify 配置
├── vercel.json             # Vercel 配置
└── wrangler.toml           # Cloudflare Workers 配置
```

## 技术栈

- 纯 HTML / CSS / JavaScript（零构建）
- Cloudflare Pages Functions（可选，用于服务端密码验证）
- QR 码：[qrcode.js](https://github.com/davidshimjs/qrcodejs)
- i18n：`data-i18n` 属性 + 字典
