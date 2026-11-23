const { db, hashPassword, signToken, normalizeSlug, slugError, normalizeOrder, sanitize, send, body, handle } = require("./_lib");

// A buyer claims their URL: checks the Shopify order, reserves the URL, creates the login.
module.exports = handle(async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const b = body(req);
  const order = normalizeOrder(b.order);
  const email = String(b.email || "").trim().toLowerCase();
  const slug = normalizeSlug(b.slug);
  const stageName = String(b.stageName || "").trim();
  const password = String(b.password || "");

  if (!order || !email) return send(res, 400, { error: "Enter your order number and the email you ordered with." });
  const slugErr = slugError(slug);
  if (slugErr) return send(res, 400, { error: slugErr });
  if (!stageName) return send(res, 400, { error: "Enter the name you want on your profile." });
  if (password.length < 8) return send(res, 400, { error: "Password must be at least 8 characters." });

  const supa = db();

  const { data: ord } = await supa.from("shop_orders").select("*").eq("order_name", order).maybeSingle();
  if (!ord || ord.email !== email) {
    return send(res, 404, { error: "We couldn't match that order number and email. Check your order confirmation email, or reply to it and we'll sort it out." });
  }
  if (ord.claimed_slug) {
    return send(res, 409, { error: "This order has already been used to set up an account. Sign in instead." });
  }

  const { data: existing } = await supa.from("performers").select("slug").eq("slug", slug).maybeSingle();
  if (existing) return send(res, 409, { error: "That URL is taken. Try another." });

  // Lock the order first so it can't be claimed twice at the same moment.
  const { data: locked } = await supa
    .from("shop_orders")
    .update({ claimed_slug: slug, claimed_at: new Date().toISOString() })
    .eq("order_name", order)
    .is("claimed_slug", null)
    .select("order_name");
  if (!locked || locked.length === 0) {
    return send(res, 409, { error: "This order has already been used to set up an account. Sign in instead." });
  }

  const { data: row, error } = await supa
    .from("performers")
    .insert({
      slug,
      password_hash: hashPassword(password),
      stage_name: stageName,
      name: stageName,
      disclaimer_enabled: true,
      anonymous_mode: false,
      pay: {},
      venues: [],
    })
    .select("*")
    .single();

  if (error) {
    await supa.from("shop_orders").update({ claimed_slug: null, claimed_at: null }).eq("order_name", order);
    const taken = /duplicate|unique/i.test(error.message);
    return send(res, taken ? 409 : 400, { error: taken ? "That URL is taken. Try another." : error.message });
  }

  send(res, 200, { token: signToken({ role: "performer", slug }), role: "performer", profile: sanitize(row) });
});
