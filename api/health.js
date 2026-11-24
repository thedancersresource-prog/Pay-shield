const { db, send } = require("./_lib");

// Quick check that the server can reach the database with its private key. Returns no data.
module.exports = async (req, res) => {
  const out = { api: "ok" };
  try {
    const { error } = await db().from("performers").select("slug", { count: "exact", head: true });
    out.database = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    out.database = `error: ${e.message}`;
  }
  out.session = (process.env.SESSION_SECRET || "").trim().length >= 32 ? "ok" : "missing";
  out.admin = (process.env.ADMIN_PASSWORD || "").trim() ? "ok" : "missing";
  out.webhook = (process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_WEBHOOK_KEY || "").trim() ? "ok" : "missing";
  res.setHeader("Cache-Control", "no-store");
  send(res, 200, out);
};
