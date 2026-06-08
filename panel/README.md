# 🦊 北极狐 · 可视化配置面板

输入**隧道域名**与 **UUID**，一键生成 **VLESS / VMess / Trojan / TUIC** 节点，支持：

- ✅ 二维码（本地内置 `qrcode.min.js`，离线可用）
- ✅ 单条 / 全部 一键复制
- ✅ Base64 订阅内容复制
- ✅ 配置自动保存在本地浏览器（localStorage），不上传服务器
- ✅ 纯静态，无构建步骤

## 使用

1. 打开页面，填写 **隧道域名**（如 `node.example.com`）。
2. 填写 / 生成 **UUID**（需与容器内一致）。
3. （可选）展开「高级选项」调整 WS 路径、TUIC 地址/端口/密码、优选 CDN 地址等。
4. 勾选要生成的协议，点击 **⚡ 生成节点**。
5. 扫码或点 **📋 复制** 导入客户端；也可 **复制全部 / 复制订阅(Base64)**。

## 本地预览

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 部署

| 平台 | 操作 |
|------|------|
| GitHub Pages | 仓库根目录的 `.github/workflows/deploy-panel-pages.yml` 会在推送到 `main` 时自动部署本目录 |
| Cloudflare Pages | `npx wrangler pages deploy . --project-name beijihu-panel`，或 Dashboard 连接仓库，输出目录填 `panel` |
| Vercel | 导入仓库，Root Directory 选 `panel`，框架选 Other |
| Netlify | 连接仓库（Base/Publish 设 `panel`）或把本目录拖到 Netlify Drop |
| 其它静态托管 | 上传本目录全部文件即可 |

## 链接格式

- **VLESS** `vless://UUID@地址:端口?encryption=none&security=tls&sni=域名&type=ws&host=域名&path=路径#名称`
- **VMess** `vmess://Base64({v,ps,add,port,id,aid,net:ws,host,path,tls,sni})`
- **Trojan** `trojan://UUID@地址:端口?security=tls&sni=域名&type=ws&host=域名&path=路径#名称`
- **TUIC** `tuic://UUID:密码@地址:端口?congestion_control=bbr&alpn=h3&sni=域名&allow_insecure=1#名称`

> 与容器 `entrypoint.sh` 打印的链接格式保持一致。
