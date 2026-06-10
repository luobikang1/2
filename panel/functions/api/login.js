/**
 * POST /api/login
 * Validates password against env.PANEL_PASS, KV, or D1.
 * Body: { "password": "xxx" }
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

  const input = (body.password || "").trim();
  if (!input) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let storedPass = "";

  // Priority 1: Environment variable
  if (env.PANEL_PASS) {
    storedPass = env.PANEL_PASS;
  }

  // Priority 2: KV binding
  if (!storedPass && env.PANEL_KV) {
    try {
      storedPass = (await env.PANEL_KV.get("panel_pass")) || "";
    } catch (e) {}
  }

  // Priority 3: D1 binding
  if (!storedPass && env.PANEL_DB) {
    try {
      const row = await env.PANEL_DB.prepare(
        "SELECT value FROM config WHERE key = 'panel_pass'"
      ).first();
      if (row && row.value) storedPass = row.value;
    } catch (e) {}
  }

  const ok = storedPass && input === storedPass;

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
