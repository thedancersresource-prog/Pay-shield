const crypto = require("crypto");
const { db, normalizeOrder, safeEqual } = require("./_lib");

// Receives Shopify's "Order payment" webhook and records the order so the buyer can claim a URL.
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const raw = await readRaw(req);
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    const given = req.headers["x-shopify-hmac-sha256"] || "";
    const expected = secret ? crypto.createHmac("sha256", secret).update(raw).digest("base64") : "";
    if (!secret || !safeEqual(given, expected)) return res.status(401).end();

    const order = JSON.parse(raw.toString("utf8"));
    const orderName = normalizeOrder(order.name || order.order_number);
    const email = String(order.email || order.contact_email || order.customer?.email || "").trim().toLowerCase();
    if (!orderName || !email) return res.status(200).json({ skipped: true });

    await db().from("shop_orders").upsert({ order_name: orderName, email }, { onConflict: "order_name", ignoreDuplicates: true });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};

module.exports.config = { api: { bodyParser: false } };
