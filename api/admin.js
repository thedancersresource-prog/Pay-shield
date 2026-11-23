const { db, hashPassword, readToken, normalizeSlug, slugError, normalizeOrder, sanitize, send, body, handle } = require("./_lib");

module.exports = handle(async (req, res) => {
  const session = readToken(req);
  if (!session || session.role !== "admin") return send(res, 401, { error: "Please sign in again." });
  const supa = db();

  if (req.method === "GET") {
    if (req.query.view === "orders") {
      const { data, error } = await supa.from("shop_orders").select("*").order("paid_at", { ascending: false });
      if (error) return send(res, 400, { error: error.message });
      return send(res, 200, { orders: data });
    }
    const { data, error } = await supa.from("performers").select("*");
    if (error) return send(res, 400, { error: error.message });
    return send(res, 200, { users: (data || []).map(sanitize) });
  }

  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const b = body(req);

  if (b.action === "create") {
    const slug = normalizeSlug(b.username);
    const err = slugError(slug);
    if (err) return send(res, 400, { error: err });
    if (!b.name || !b.password) return send(res, 400, { error: "All fields required." });
    const { error } = await supa.from("performers").insert({
      slug,
      password_hash: hashPassword(b.password),
      stage_name: b.name,
      name: b.name,
      disclaimer_enabled: true,
      anonymous_mode: false,
      pay: {},
      venues: [],
    });
    if (error) return send(res, 400, { error: /duplicate|unique/i.test(error.message) ? "That URL is taken." : error.message });
    return send(res, 200, { ok: true, slug });
  }

  if (b.action === "delete") {
    const slug = normalizeSlug(b.slug);
    await supa.from("performers").delete().eq("slug", slug);
    await supa.from("shop_orders").update({ claimed_slug: null, claimed_at: null }).eq("claimed_slug", slug);
    return send(res, 200, { ok: true });
  }

  if (b.action === "programmed") {
    const { error } = await supa.from("shop_orders").update({ chips_programmed: !!b.value }).eq("order_name", normalizeOrder(b.order));
    if (error) return send(res, 400, { error: error.message });
    return send(res, 200, { ok: true });
  }

  // For orders placed before the webhook was set up.
  if (b.action === "addOrder") {
    const order = normalizeOrder(b.order);
    const email = String(b.email || "").trim().toLowerCase();
    if (!order || !email) return send(res, 400, { error: "Order number and email required." });
    const { error } = await supa.from("shop_orders").upsert({ order_name: order, email }, { onConflict: "order_name" });
    if (error) return send(res, 400, { error: error.message });
    return send(res, 200, { ok: true });
  }

  send(res, 400, { error: "Unknown action." });
});
