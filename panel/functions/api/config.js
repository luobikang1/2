/**
 * GET /api/config
 * Returns whether login is required and the proxy UUID (for usable node generation).
 * Login is required when LOGIN_UUID and LOGIN_DOMAIN env vars are set,
 * or when KV/D1 have stored credentials.
 * The proxy UUID (env.UUID) is returned so the panel can auto-generate a usable node.
 */
export async function onRequestGet(context) {
  const { env } = context;
  let hasCredentials = false;

  // Priority 1: Environment variables
  if (env.LOGIN_UUID && env.LOGIN_DOMAIN) {
    hasCredentials = true;
  }

  // Priority 2: KV binding
  if (!hasCredentials && env.PANEL_KV) {
    try {
      const uuid = await env.PANEL_KV.get("login_uuid");
      const domain = await env.PANEL_KV.get("login_domain");
      if (uuid && domain) hasCredentials = true;
    } catch (e) {}
  }

  // Priority 3: D1 binding
  if (!hasCredentials && env.PANEL_DB) {
    try {
      const row = await env.PANEL_DB.prepare(
        "SELECT value FROM config WHERE key = 'login_uuid'"
      ).first();
      if (row && row.value) hasCredentials = true;
    } catch (e) {}
  }

  // Proxy UUID for auto-generating usable nodes
  const proxyUuid = env.UUID || "";

  return new Response(JSON.stringify({ protected: hasCredentials, proxyUuid: proxyUuid }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
