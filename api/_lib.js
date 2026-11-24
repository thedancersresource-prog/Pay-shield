// Shared server helpers for the TAPPED API. Files starting with "_" are not exposed as routes on Vercel.
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wpdciwlmkcujworsywbl.supabase.co";

// Public (anon) key: same one the browser app already ships. Only reads the public_profiles view.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZGNpd2xta2N1andvcnN5d2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTk2MjUsImV4cCI6MjA5NDc5NTYyNX0.oMzZ92MA37WDnIDpVtVcOBOzXobAxxlMjq_0gE0fHE8";

function anonDb() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

function db() {
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  // New-style sb_secret_ keys belong only in the apikey header. Some client versions also send them
  // as "Authorization: Bearer", which Supabase rejects as an invalid key, so strip that here.
  const keyFetch = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    return fetch(input, { ...init, headers });
  };
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false }, global: { fetch: keyFetch } });
}

// Passwords: scrypt with a random salt. Stored as scrypt$<salt hex>$<hash hex>.
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function verifyPassword(pw, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(String(pw), Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// Sessions: HMAC-signed token, sent as "Authorization: Bearer <token>".
function secret() {
  const s = String(process.env.SESSION_SECRET || "").trim();
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to 32+ characters");
  return s;
}

function signToken(payload, days = 30) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readToken(req) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [body, sig] = t.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

const RESERVED = new Set(["claim", "api", "admin", "login", "setup", "assets", "settings", "dashboard", "tapped", "support", "help", "www", "index.html"]);

function normalizeSlug(s) {
  return String(s || "").trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
}

function slugError(slug) {
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(slug)) return "Use 3 to 30 letters, numbers, dashes or underscores.";
  if (RESERVED.has(slug)) return "That URL is reserved. Try another.";
  return null;
}

function normalizeOrder(o) {
  return String(o || "").trim().replace(/^#/, "").replace(/\s+/g, "");
}

const PRIVATE_FIELDS = ["password", "password_hash"];
const PUBLIC_FIELDS = ["slug", "stage_name", "name", "bio", "message", "photo_url", "pay", "venues", "disclaimer_enabled", "message_enabled", "photo_enabled", "info_capture_enabled", "anonymous_mode"];
const EDITABLE_FIELDS = ["stage_name", "name", "bio", "message", "photo_url", "pay", "venues", "disclaimer_enabled", "message_enabled", "photo_enabled", "info_capture_enabled", "anonymous_mode"];

function sanitize(row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of PRIVATE_FIELDS) delete out[f];
  return out;
}

function pick(row, fields) {
  const out = {};
  for (const f of fields) if (row && f in row) out[f] = row[f];
  return out;
}

function send(res, status, data) {
  res.status(status).json(data);
}

function body(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      console.error(e);
      send(res, 500, { error: "Something went wrong. Try again." });
    }
  };
}

module.exports = {
  db, anonDb, hashPassword, verifyPassword, safeEqual, signToken, readToken,
  normalizeSlug, slugError, normalizeOrder, sanitize, pick,
  PUBLIC_FIELDS, EDITABLE_FIELDS, send, body, handle,
};
