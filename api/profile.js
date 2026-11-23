const { db, hashPassword, readToken, sanitize, EDITABLE_FIELDS, send, body, handle } = require("./_lib");

// GET: the signed-in performer's profile. PUT: save profile edits. POST: change password.
module.exports = handle(async (req, res) => {
  const session = readToken(req);
  if (!session || session.role !== "performer") return send(res, 401, { error: "Please sign in again." });

  const supa = db();
  const { data: row } = await supa.from("performers").select("*").eq("slug", session.slug).maybeSingle();
  if (!row) return send(res, 404, { error: "Account not found." });

  if (req.method === "GET") return send(res, 200, { profile: sanitize(row) });

  if (req.method === "PUT") {
    const b = body(req);
    const update = {};
    for (const f of EDITABLE_FIELDS) if (f in row && f in b) update[f] = b[f];
    const { data, error } = await supa.from("performers").update(update).eq("slug", session.slug).select("*").single();
    if (error) return send(res, 400, { error: error.message });
    return send(res, 200, { profile: sanitize(data) });
  }

  if (req.method === "POST") {
    const { newPassword } = body(req);
    if (!newPassword || String(newPassword).length < 8) return send(res, 400, { error: "Password must be at least 8 characters." });
    const { error } = await supa.from("performers").update({ password_hash: hashPassword(newPassword), password: null }).eq("slug", session.slug);
    if (error) return send(res, 400, { error: error.message });
    return send(res, 200, { ok: true });
  }

  send(res, 405, { error: "Method not allowed" });
});
