const { db, normalizeSlug, pick, PUBLIC_FIELDS, send, handle } = require("./_lib");

// Public profile shown when someone taps a chip. Never returns passwords.
module.exports = handle(async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  const slug = normalizeSlug(req.query.slug);
  if (!slug) return send(res, 400, { error: "Missing profile." });

  const { data: row } = await db().from("performers").select("*").eq("slug", slug).maybeSingle();
  if (!row) return send(res, 404, { error: "Profile not found." });

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  send(res, 200, { profile: pick(row, PUBLIC_FIELDS) });
});
