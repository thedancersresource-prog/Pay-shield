const { anonDb, normalizeSlug, slugError, send, handle } = require("./_lib");

// Live availability check for the URL picker on the claim page.
module.exports = handle(async (req, res) => {
  const slug = normalizeSlug(req.query.slug);
  const err = slugError(slug);
  if (err) return send(res, 200, { available: false, error: err });

  const { data } = await anonDb().from("public_profiles").select("slug").eq("slug", slug).maybeSingle();
  if (data) return send(res, 200, { available: false, error: "That URL is taken. Try another." });
  send(res, 200, { available: true });
});
