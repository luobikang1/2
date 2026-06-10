/**
 * Middleware: serves static files normally, passes /api/* to API functions,
 * and handles VLESS WebSocket proxy on other paths when UUID is configured.
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Let /api/* pass through to API functions
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // Let static files pass through (HTML, CSS, JS, etc.)
  const staticExts = ["/", ".html", ".css", ".js", ".json", ".png", ".ico", ".svg", ".toml", ".txt"];
  const ext = url.pathname.includes(".") ? "." + url.pathname.split(".").pop() : "/";
  if (url.pathname === "/" || staticExts.includes(ext) || url.pathname === "/index.html") {
    return next();
  }

  // VLESS proxy: only if UUID is configured and it's a WebSocket upgrade
  const userUuid = env.UUID || env.LOGIN_UUID || "";
  if (!userUuid) {
    return next();
  }

  const upgradeHeader = request.headers.get("Upgrade");
  if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
    return handleVlessWs(request, userUuid);
  }

  // Non-WebSocket request to non-static path — return info page
  return new Response("北极狐 - VLESS Worker Active", {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

// ---- VLESS WebSocket Handler ----
async function handleVlessWs(request, userUuid) {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  let headerParsed = false;
  let remoteSocket = null;
  let remoteReady = false;
  let buffer = new Uint8Array(0);
  let pendingData = []; // buffer messages arriving before remote is connected

  server.addEventListener("message", async (event) => {
    const data = new Uint8Array(event.data);

    if (!headerParsed) {
      buffer = concatBytes(buffer, data);

      const parsed = parseVlessHeader(buffer, userUuid);
      if (!parsed) return; // need more data
      if (parsed.error) {
        server.close(1002, parsed.error);
        return;
      }

      headerParsed = true;

      // Send VLESS response header
      server.send(new Uint8Array([parsed.version, 0]));

      // Connect to remote
      try {
        remoteSocket = connect({ hostname: parsed.address, port: parsed.port });
        const writer = remoteSocket.writable.getWriter();

        // Write initial payload if any
        if (parsed.payload.length > 0) {
          await writer.write(parsed.payload);
        }

        // Flush any messages that arrived during connection setup
        for (const chunk of pendingData) {
          await writer.write(chunk);
        }
        pendingData = [];
        writer.releaseLock();
        remoteReady = true;

        // Pipe remote -> client
        pipeRemoteToWs(remoteSocket.readable, server);
      } catch (e) {
        server.close(1011, "Remote connection failed");
      }
    } else {
      // Forward data to remote (buffer if not yet ready)
      if (remoteReady && remoteSocket) {
        const writer = remoteSocket.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
      } else {
        pendingData.push(data);
      }
    }
  });

  server.addEventListener("close", () => {
    if (remoteSocket) {
      try { remoteSocket.close(); } catch (e) {}
    }
  });

  server.addEventListener("error", () => {
    if (remoteSocket) {
      try { remoteSocket.close(); } catch (e) {}
    }
  });

  return new Response(null, { status: 101, webSocket: client });
}

function parseVlessHeader(buffer, expectedUuid) {
  // Minimum VLESS header: 1(ver) + 16(uuid) + 1(addon_len) + 1(cmd) + 2(port) + 1(addr_type) + 1(addr_min)
  if (buffer.length < 24) return null;

  const version = buffer[0];
  const uuidBytes = buffer.slice(1, 17);
  const clientUuid = bytesToUuid(uuidBytes);

  if (clientUuid.toLowerCase() !== expectedUuid.toLowerCase()) {
    return { error: "Invalid UUID" };
  }

  const addonLen = buffer[17];
  let offset = 18 + addonLen;

  if (buffer.length < offset + 4) return null;

  const command = buffer[offset];
  offset += 1;

  // Only support TCP (command 1)
  if (command !== 1) {
    return { error: "Unsupported command: " + command };
  }

  const port = (buffer[offset] << 8) | buffer[offset + 1];
  offset += 2;

  const addrType = buffer[offset];
  offset += 1;

  let address = "";
  if (addrType === 1) {
    // IPv4
    if (buffer.length < offset + 4) return null;
    address = buffer[offset] + "." + buffer[offset + 1] + "." + buffer[offset + 2] + "." + buffer[offset + 3];
    offset += 4;
  } else if (addrType === 2) {
    // Domain
    const domainLen = buffer[offset];
    offset += 1;
    if (buffer.length < offset + domainLen) return null;
    address = new TextDecoder().decode(buffer.slice(offset, offset + domainLen));
    offset += domainLen;
  } else if (addrType === 3) {
    // IPv6
    if (buffer.length < offset + 16) return null;
    const ipv6 = [];
    for (let i = 0; i < 16; i += 2) {
      ipv6.push(((buffer[offset + i] << 8) | buffer[offset + i + 1]).toString(16));
    }
    address = "[" + ipv6.join(":") + "]";
    offset += 16;
  } else {
    return { error: "Unknown address type: " + addrType };
  }

  const payload = buffer.slice(offset);

  return { version, address, port, payload };
}

async function pipeRemoteToWs(readable, ws) {
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (ws.readyState === 1) {
        ws.send(value);
      } else {
        break;
      }
    }
  } catch (e) {
    // Connection closed
  } finally {
    reader.releaseLock();
  }
}

function concatBytes(a, b) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function bytesToUuid(bytes) {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
}
