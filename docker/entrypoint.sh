#!/usr/bin/env bash
# ============================================================================
#  🦊 北极狐 (Arctic Fox) entrypoint
#  生成 sing-box 配置 + 自签证书，启动 sing-box 与 cloudflared，并打印节点链接
# ============================================================================
set -euo pipefail

WORKDIR="/etc/beijihu"
CONFIG="${WORKDIR}/config.json"
CERT="${WORKDIR}/cert.pem"
KEY="${WORKDIR}/key.pem"
mkdir -p "${WORKDIR}"

log() { printf '\033[1;36m[北极狐]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[北极狐]\033[0m %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1) 基础参数
# ---------------------------------------------------------------------------
if [ -z "${UUID:-}" ]; then
  UUID="$(cat /proc/sys/kernel/random/uuid)"
  warn "未提供 UUID，已自动生成: ${UUID}"
fi
TUIC_PASSWORD="${TUIC_PASSWORD:-$UUID}"
NODE_NAME="${NODE_NAME:-北极狐}"
LOG_LEVEL="${LOG_LEVEL:-info}"

VLESS_PATH="${VLESS_PATH:-/vless}"
VMESS_PATH="${VMESS_PATH:-/vmess}"
TROJAN_PATH="${TROJAN_PATH:-/trojan}"
VLESS_PORT="${VLESS_PORT:-8001}"
VMESS_PORT="${VMESS_PORT:-8002}"
TROJAN_PORT="${TROJAN_PORT:-8003}"
TUIC_PORT="${TUIC_PORT:-443}"

# SNI/证书域名：优先使用隧道域名，否则使用一个通用伪装域名
SNI="${ARGO_DOMAIN:-www.bing.com}"

# ---------------------------------------------------------------------------
# 2) 自签证书 (供 TUIC 直连使用，客户端需 allow_insecure)
# ---------------------------------------------------------------------------
if [ ! -f "${CERT}" ] || [ ! -f "${KEY}" ]; then
  log "生成自签 TLS 证书 (CN=${SNI}) ..."
  openssl ecparam -genkey -name prime256v1 -out "${KEY}" >/dev/null 2>&1
  openssl req -new -x509 -days 3650 -key "${KEY}" -out "${CERT}" \
    -subj "/CN=${SNI}" >/dev/null 2>&1
fi

# ---------------------------------------------------------------------------
# 3) 生成 sing-box 配置
# ---------------------------------------------------------------------------
log "生成 sing-box 配置 -> ${CONFIG}"
cat > "${CONFIG}" <<EOF
{
  "log": { "level": "${LOG_LEVEL}", "timestamp": true },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-ws-in",
      "listen": "::",
      "listen_port": ${VLESS_PORT},
      "users": [ { "uuid": "${UUID}" } ],
      "transport": { "type": "ws", "path": "${VLESS_PATH}" }
    },
    {
      "type": "vmess",
      "tag": "vmess-ws-in",
      "listen": "::",
      "listen_port": ${VMESS_PORT},
      "users": [ { "uuid": "${UUID}", "alterId": 0 } ],
      "transport": { "type": "ws", "path": "${VMESS_PATH}" }
    },
    {
      "type": "trojan",
      "tag": "trojan-ws-in",
      "listen": "::",
      "listen_port": ${TROJAN_PORT},
      "users": [ { "password": "${UUID}" } ],
      "transport": { "type": "ws", "path": "${TROJAN_PATH}" }
    },
    {
      "type": "tuic",
      "tag": "tuic-in",
      "listen": "::",
      "listen_port": ${TUIC_PORT},
      "users": [ { "uuid": "${UUID}", "password": "${TUIC_PASSWORD}" } ],
      "congestion_control": "bbr",
      "auth_timeout": "3s",
      "zero_rtt_handshake": false,
      "heartbeat": "10s",
      "tls": {
        "enabled": true,
        "server_name": "${SNI}",
        "alpn": [ "h3" ],
        "certificate_path": "${CERT}",
        "key_path": "${KEY}"
      }
    }
  ],
  "outbounds": [
    { "type": "direct", "tag": "direct" }
  ]
}
EOF

# 校验配置
if ! sing-box check -c "${CONFIG}"; then
  warn "sing-box 配置校验失败，请检查上方报错"
  exit 1
fi
log "sing-box 配置校验通过 ✓"

# ---------------------------------------------------------------------------
# 4) 启动 sing-box
# ---------------------------------------------------------------------------
log "启动 sing-box ..."
sing-box run -c "${CONFIG}" &
SB_PID=$!

# ---------------------------------------------------------------------------
# 5) 启动 cloudflared (Argo 隧道)
# ---------------------------------------------------------------------------
QUICK_DOMAIN=""
if [ -n "${TUNNEL_TOKEN:-}" ]; then
  log "使用固定隧道令牌启动 cloudflared (Token 模式)"
  log "请确保已在 Cloudflare Zero Trust 面板将域名指向 http://localhost:${VLESS_PORT}"
  cloudflared tunnel --no-autoupdate --loglevel "${LOG_LEVEL}" run --token "${TUNNEL_TOKEN}" &
  CF_PID=$!
else
  warn "未提供 TUNNEL_TOKEN，启用临时快速隧道 (TryCloudflare)，域名每次重启会变化"
  QLOG="${WORKDIR}/quick.log"
  cloudflared tunnel --no-autoupdate --loglevel "${LOG_LEVEL}" \
    --url "http://localhost:${VLESS_PORT}" > "${QLOG}" 2>&1 &
  CF_PID=$!
  # 解析临时域名 (grep 未命中会返回非零，需 || true 以兼容 set -e/pipefail)
  for _ in $(seq 1 30); do
    QUICK_DOMAIN="$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "${QLOG}" 2>/dev/null | head -n1 | sed 's#https://##' || true)"
    [ -n "${QUICK_DOMAIN}" ] && break
    sleep 1
  done
  [ -n "${QUICK_DOMAIN}" ] && ARGO_DOMAIN="${QUICK_DOMAIN}"
fi

# ---------------------------------------------------------------------------
# 6) 打印节点链接
# ---------------------------------------------------------------------------
get_public_ip() {
  local ip=""
  for u in "https://api.ipify.org" "https://ifconfig.me/ip" "https://icanhazip.com" "https://ipinfo.io/ip"; do
    ip="$(curl -fsS --max-time 5 "$u" 2>/dev/null | tr -d '[:space:]' || true)"
    if printf '%s' "$ip" | grep -qE '^[0-9a-fA-F:.]+$'; then printf '%s' "$ip"; return 0; fi
  done
  printf 'YOUR_SERVER_IP'
}
PUBLIC_IP="$(get_public_ip)"

print_links() {
  local d="${ARGO_DOMAIN:-}"
  echo ""
  echo "==================== 🦊 北极狐 节点信息 ===================="
  echo " UUID         : ${UUID}"
  echo " TUIC 密码    : ${TUIC_PASSWORD}"
  echo " 隧道域名     : ${d:-<未知，请在面板填写你的隧道域名>}"
  echo " 服务器 IP    : ${PUBLIC_IP}  (TUIC 直连使用)"
  echo "-----------------------------------------------------------"
  if [ -n "${d}" ]; then
    echo " VLESS  : vless://${UUID}@${d}:443?encryption=none&security=tls&sni=${d}&type=ws&host=${d}&path=$(printf '%s' "${VLESS_PATH}" | sed 's#/#%2F#g')#${NODE_NAME}-vless"
    local vmess_json
    vmess_json=$(printf '{"v":"2","ps":"%s-vmess","add":"%s","port":"443","id":"%s","aid":"0","scy":"auto","net":"ws","type":"none","host":"%s","path":"%s","tls":"tls","sni":"%s"}' \
      "${NODE_NAME}" "${d}" "${UUID}" "${d}" "${VMESS_PATH}" "${d}")
    echo " VMess  : vmess://$(printf '%s' "${vmess_json}" | base64 -w0)"
    echo " Trojan : trojan://${UUID}@${d}:443?security=tls&sni=${d}&type=ws&host=${d}&path=$(printf '%s' "${TROJAN_PATH}" | sed 's#/#%2F#g')#${NODE_NAME}-trojan"
  fi
  echo " TUIC   : tuic://${UUID}:${TUIC_PASSWORD}@${PUBLIC_IP}:${TUIC_PORT}?congestion_control=bbr&alpn=h3&sni=${SNI}&allow_insecure=1#${NODE_NAME}-tuic"
  echo "==========================================================="
  echo " 提示: 可视化面板中输入【隧道域名】即可一键生成上述节点与二维码"
  echo "==========================================================="
  echo ""
}
print_links

# ---------------------------------------------------------------------------
# 7) 守护进程
# ---------------------------------------------------------------------------
term() { warn "收到退出信号，正在停止..."; kill "${SB_PID}" "${CF_PID}" 2>/dev/null || true; }
trap term TERM INT

# 任一进程退出则容器退出
wait -n "${SB_PID}" "${CF_PID}"
EXIT_CODE=$?
warn "子进程退出 (code=${EXIT_CODE})，正在收尾"
term
exit "${EXIT_CODE}"
