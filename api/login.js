const { db, hashPassword, verifyPassword, safeEqual, signToken, normalizeSlug, sanitize, send, body, handle } = require("./_lib");

module.exports = handle(async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const { username, password } = body(req);
  const slug = normalizeSlug(username);
  if (!slug || !password) return send(res, 400, { error: "Enter your username and password." });

  // Admin login: credentials live only in Vercel environment variables.
  const adminUser = (process.env.ADMIN_USERNAME || "tapped_admin").toLowerCase();
  if (slug === adminUser) {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (adminPw && safeEqual(password, adminPw)) {
      return send(res, 200, { token: signToken({ role: "admin", slug: adminUser }, 1), role: "admin" });
    }
    return send(res, 401, { error: "Invalid username or password" });
  }

  const supa = db();
  const { data: row } = await supa.from("performers").select("*").eq("slug", slug).maybeSingle();

  let ok = false;
  if (row) {
    if (row.password_hash) {
      ok = verifyPassword(password, row.password_hash);
    } else if (row.password && safeEqual(password, row.password)) {
      // Older account with a plain-text password: upgrade it to a hash on first login.
      ok = true;
      await supa.from("performers").update({ password_hash: hashPassword(password), password: null }).eq("slug", slug);
    }
  }
  if (!ok) return send(res, 401, { error: "Invalid username or password" });

  send(res, 200, { token: signToken({ role: "performer", slug }), role: "performer", profile: sanitize(row) });
});
