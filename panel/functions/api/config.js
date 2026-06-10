/**
 * GET /api/config
 * Returns whether password protection is enabled.
 * Reads from: env.PANEL_PASS, KV binding PANEL_KV, or D1 binding PANEL_DB
 */
export async function onRequestGet(context) {
  const { env } = context;
  let hasPassword = false;

  // Priority 1: Environment variable
  if (env.PANEL_PASS) {
    hasPassword = true;
  }

  // Priority 2: KV binding
  if (!hasPassword && env.PANEL_KV) {
    try {
      const val = await env.PANEL_KV.get("panel_pass");
      if (val) hasPassword = true;
    } catch (e) {}
  }

  // Priority 3: D1 binding
  if (!hasPassword && env.PANEL_DB) {
    try {
      const row = await env.PANEL_DB.prepare(
        "SELECT value FROM config WHERE key = 'panel_pass'"
      ).first();
      if (row && row.value) hasPassword = true;
    } catch (e) {}
  }

  return new Response(JSON.stringify({ protected: hasPassword }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
