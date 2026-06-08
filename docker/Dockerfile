# syntax=docker/dockerfile:1
# ============================================================================
#  🦊 北极狐 (Arctic Fox) v2 — TUIC + Hysteria2 + Argo 隧道节点
#  单容器集成: cloudflared (Cloudflare Tunnel) + sing-box (VLESS/VMess/Trojan/TUIC/Hysteria2)
#  只需提供 Cloudflare 隧道令牌 (TUNNEL_TOKEN) 与 UUID 即可起飞
# ============================================================================

FROM alpine:3.20 AS fetch

# 可在构建时覆盖版本: --build-arg SING_BOX_VERSION=1.11.15
ARG SING_BOX_VERSION=1.11.15
ARG TARGETARCH

RUN apk add --no-cache curl tar ca-certificates

# ---- sing-box ----
RUN set -eux; \
    case "${TARGETARCH:-amd64}" in \
      amd64) SB_ARCH="amd64" ;; \
      arm64) SB_ARCH="arm64" ;; \
      arm)   SB_ARCH="armv7" ;; \
      *)     SB_ARCH="amd64" ;; \
    esac; \
    cd /tmp; \
    curl -fsSL -o sing-box.tar.gz \
      "https://github.com/SagerNet/sing-box/releases/download/v${SING_BOX_VERSION}/sing-box-${SING_BOX_VERSION}-linux-${SB_ARCH}.tar.gz"; \
    tar -xzf sing-box.tar.gz; \
    install -m 0755 "sing-box-${SING_BOX_VERSION}-linux-${SB_ARCH}/sing-box" /usr/local/bin/sing-box; \
    /usr/local/bin/sing-box version

# ---- cloudflared ----
RUN set -eux; \
    case "${TARGETARCH:-amd64}" in \
      amd64) CF_ARCH="amd64" ;; \
      arm64) CF_ARCH="arm64" ;; \
      arm)   CF_ARCH="arm" ;; \
      *)     CF_ARCH="amd64" ;; \
    esac; \
    curl -fsSL -o /usr/local/bin/cloudflared \
      "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"; \
    chmod +x /usr/local/bin/cloudflared; \
    /usr/local/bin/cloudflared --version

# ============================================================================
FROM alpine:3.20

LABEL org.opencontainers.image.title="beijihu-tuic" \
      org.opencontainers.image.description="北极狐 Arctic Fox v2 — TUIC + Hysteria2 + Cloudflare Argo tunnel node" \
      org.opencontainers.image.licenses="MIT"

RUN apk add --no-cache ca-certificates openssl jq tzdata bash coreutils tini curl \
    && rm -rf /var/cache/apk/*

COPY --from=fetch /usr/local/bin/sing-box   /usr/local/bin/sing-box
COPY --from=fetch /usr/local/bin/cloudflared /usr/local/bin/cloudflared

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 默认环境变量 (可在 docker run -e / compose 覆盖)
ENV ARGO_DOMAIN="" \
    VLESS_PATH="/vless" \
    VMESS_PATH="/vmess" \
    TROJAN_PATH="/trojan" \
    VLESS_PORT="8001" \
    VMESS_PORT="8002" \
    TROJAN_PORT="8003" \
    TUIC_PORT="443" \
    HYSTERIA2_PORT="8443" \
    NODE_NAME="北极狐" \
    LOG_LEVEL="info"

# TUIC 直连端口 (UDP) + Hysteria2 直连端口 (UDP)
EXPOSE 443/udp
EXPOSE 8443/udp

# 健康检查: 确认 sing-box 进程存活
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD pgrep -x sing-box > /dev/null && pgrep -x cloudflared > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/entrypoint.sh"]
