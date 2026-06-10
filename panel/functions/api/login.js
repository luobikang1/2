/**
 * POST /api/login
 * Validates UUID + Domain against env vars, KV, or D1.
 * Body: { "uuid": "xxx", "domain": "yyy" }
 * Returns: { "ok": true/false }
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const inputUuid = (body.uuid || "").trim();
  const inputDomain = (body.domain || "").trim().toLowerCase();

  if (!inputUuid || !inputDomain) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let storedUuid = "";
  let storedDomain = "";

  // Priority 1: Environment variables
  if (env.LOGIN_UUID && env.LOGIN_DOMAIN) {
    storedUuid = env.LOGIN_UUID;
    storedDomain = env.LOGIN_DOMAIN;
  }

  // Priority 2: KV binding
  if (!storedUuid && env.PANEL_KV) {
    try {
      storedUuid = (await env.PANEL_KV.get("login_uuid")) || "";
      storedDomain = (await env.PANEL_KV.get("login_domain")) || "";
    } catch (e) {}
  }

  // Priority 3: D1 binding
  if (!storedUuid && env.PANEL_DB) {
    try {
      const uuidRow = await env.PANEL_DB.prepare(
        "SELECT value FROM config WHERE key = 'login_uuid'"
      ).first();
      const domainRow = await env.PANEL_DB.prepare(
        "SELECT value FROM config WHERE key = 'login_domain'"
      ).first();
      if (uuidRow) storedUuid = uuidRow.value || "";
      if (domainRow) storedDomain = domainRow.value || "";
    } catch (e) {}
  }

  const ok = storedUuid && storedDomain &&
    inputUuid === storedUuid &&
    inputDomain === storedDomain.toLowerCase();

  return new Response(JSON.stringify({ ok }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
