# 🦊 白狐 White Fox

> TUIC + Cloudflare Argo 隧道节点 · 一个容器搞定 · 可视化面板一键生成节点

![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker-ready-2496ed)
![Panel](https://img.shields.io/badge/panel-static-orange)

白狐是一套「**Docker 隧道节点** + **可视化配置面板**」组合：

- 🐳 **一个容器** 同时集成 [cloudflared](https://github.com/cloudflare/cloudflared)（Cloudflare 隧道）与 [sing-box](https://github.com/SagerNet/sing-box)（VLESS / VMess / Trojan / **TUIC**）。
- 🔑 **只需隧道令牌 + UUID** 即可起飞；不填令牌则自动启用临时 TryCloudflare 隧道用于测试。
- 🛰️ **完美支持 TUIC 协议**（QUIC / UDP 直连，BBR 拥塞控制）。
- 🌐 **可视化面板**：输入隧道域名一键生成节点，支持**二维码**、**一键复制**、**Base64 订阅**。
- ☁️ 面板可部署到 **GitHub Pages / Cloudflare Pages / Vercel / Netlify** 等任意静态托管。

```
┌──────────────────────────── Docker 容器 (baihu) ────────────────────────────┐
│                                                                              │
│   cloudflared ──(Argo 隧道, 令牌)── Cloudflare 边缘 ── 你的域名:443 (TLS/WS) │
│        │                                                                     │
│        └─▶ sing-box   :8001 VLESS-WS   :8002 VMess-WS   :8003 Trojan-WS     │
│            sing-box   :443/udp  TUIC (QUIC, 直连, 自签证书)                   │
└──────────────────────────────────────────────────────────────────────────────┘
                         ▲                                  ▲
            （WS 节点经 Cloudflare CDN）        （TUIC 直连服务器公网 IP）
```

> ⚠️ **为什么 TUIC 走直连而不经隧道？** Cloudflare Tunnel 本质是 TCP/HTTP 隧道，而 TUIC 基于 QUIC/UDP，二者无法叠加。因此白狐采用业界通行方案：**VLESS/VMess/Trojan over WebSocket 经 Argo 隧道**（享受 Cloudflare CDN、隐藏源站 IP），同时内置**原生 TUIC 直连端口**满足对 TUIC 的需求。

---

## 📁 目录结构

```
.
├── docker/                      # 隧道节点 (Docker)
│   ├── Dockerfile               #   cloudflared + sing-box 镜像
│   ├── entrypoint.sh            #   按环境变量生成配置、启动、打印节点链接
│   ├── docker-compose.yml       #   一键编排
│   └── .env.example             #   环境变量示例（最少只需 TUNNEL_TOKEN + UUID）
├── panel/                       # 可视化配置面板 (纯静态)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── js/qrcode.min.js         #   本地内置二维码库（离线可用）
│   ├── vercel.json / netlify.toml / wrangler.toml / _headers / _redirects
│   └── README.md
└── .github/workflows/
    └── deploy-panel-pages.yml   # 面板 → GitHub Pages 自动部署
```

---

## 🐳 一、部署隧道节点 (Docker)

### 1. 准备 Cloudflare 隧道令牌（Token）

1. 进入 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks → Tunnels → Create a tunnel**。
2. 选择 **Cloudflared**，命名隧道，复制安装命令中 `--token` 后面的那一长串，即为 `TUNNEL_TOKEN`。
3. 在隧道的 **Public Hostnames** 里添加：
   - **Subdomain/Domain**：你的域名，例如 `node.example.com`
   - **Service**：`HTTP` → `localhost:8001`（默认指向 VLESS）
   - 如需 VMess / Trojan，可再加两条按 **Path** 匹配的记录：
     - `Path = vmess`  → `http://localhost:8002`
     - `Path = trojan` → `http://localhost:8003`

### 2. 使用 docker compose（推荐）

```bash
cd docker
cp .env.example .env
# 编辑 .env，至少填写 TUNNEL_TOKEN 与 UUID（UUID 留空会自动生成）
docker compose up -d --build
docker compose logs -f          # 查看自动打印的节点链接
```

### 3. 或使用 docker run

```bash
docker build -t baihu-tuic ./docker

docker run -d --name baihu \
  --restart unless-stopped \
  -p 443:443/udp \
  -e TUNNEL_TOKEN="你的隧道令牌" \
  -e UUID="$(cat /proc/sys/kernel/random/uuid)" \
  -e ARGO_DOMAIN="node.example.com" \
  baihu-tuic

docker logs -f baihu
```

启动后日志会直接打印 **VLESS / VMess / Trojan / TUIC** 四个节点链接，可直接复制使用。

### 环境变量一览

| 变量 | 必填 | 默认 | 说明 |
|------|:--:|------|------|
| `TUNNEL_TOKEN` | 推荐 | 空 | Cloudflare 隧道令牌；留空则启用临时 TryCloudflare 隧道（域名随机） |
| `UUID` | 推荐 | 自动生成 | VLESS/VMess/Trojan/TUIC 共用 |
| `ARGO_DOMAIN` | 推荐 | 空 | 你的固定隧道域名，用于打印链接与 TUIC 证书 SNI |
| `NODE_NAME` | 否 | 白狐 | 节点名称前缀 |
| `VLESS_PATH` / `VMESS_PATH` / `TROJAN_PATH` | 否 | `/vless` `/vmess` `/trojan` | WS 路径 |
| `VLESS_PORT` / `VMESS_PORT` / `TROJAN_PORT` | 否 | `8001` `8002` `8003` | sing-box 本地监听端口（cloudflared 指向它们） |
| `TUIC_PORT` | 否 | `443` | TUIC 直连 UDP 端口（记得 `-p` 映射） |
| `TUIC_PASSWORD` | 否 | =UUID | TUIC 密码 |
| `LOG_LEVEL` | 否 | `info` | 日志级别 |

> 🐳 **支持各种隧道与部署方式**：除 Cloudflare 隧道外，镜像本身就是标准 sing-box 节点，可在任意 VPS / NAS / Docker 平台运行；不提供令牌时用 TryCloudflare 临时隧道，也可关掉隧道仅用 TUIC 直连。

---

## 🌐 二、部署可视化面板 (Panel)

面板是**纯静态**页面（无需构建），打开后只要输入**隧道域名**和 **UUID** 即可生成全部节点，并展示二维码、支持一键复制与订阅。

详见 [`panel/README.md`](panel/README.md)。快速部署：

| 平台 | 方式 |
|------|------|
| **GitHub Pages** | 已内置 `.github/workflows/deploy-panel-pages.yml`，推送到 `main` 自动部署 `panel/` |
| **Cloudflare Pages** | `npx wrangler pages deploy panel --project-name baihu-panel`；或在 Dashboard 连接仓库，构建输出目录填 `panel` |
| **Vercel** | 导入仓库，**Root Directory** 设为 `panel`，框架选 Other |
| **Netlify** | 连接仓库，Base/Publish 目录设为 `panel`；或把 `panel/` 拖到 [Netlify Drop](https://app.netlify.com/drop) |
| **任意静态托管** | 直接上传 `panel/` 目录下所有文件 |

本地预览：

```bash
cd panel
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

---

## 🔒 安全与说明

- 面板为**纯前端**生成，所有输入仅保存在你**本地浏览器**（localStorage），不会上传任何服务器。
- TUIC 使用容器内自签证书，客户端需开启 `allow_insecure`（链接已带 `allow_insecure=1`）；若希望使用受信证书，可改用真实域名证书。
- Docker 镜像基于 Alpine Linux，体积小、启动快，同时支持 `amd64` / `arm64` / `armv7` 架构。
- 请勿将含真实 `TUNNEL_TOKEN` 的 `.env` 提交到公开仓库（`.gitignore` 已默认排除，但请注意安全）。

---

## 📜 License

MIT
