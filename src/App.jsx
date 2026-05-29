import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";

const PAY_PLATFORMS = [
{ id: "cashapp", label: "Cash App", abbr: "CA", placeholder: "$YourCashTag" },
{ id: "venmo", label: "Venmo", abbr: "V", placeholder: "@YourVenmo" },
{ id: "zelle", label: "Zelle", abbr: "Z", placeholder: "phone or email" },
{ id: "paypal", label: "PayPal", abbr: "PP", placeholder: "paypal.me/yourlink" },
{ id: "applepay", label: "Apple Pay", abbr: "AP", placeholder: "phone number" },
{ id: "onlyfans", label: "OnlyFans", abbr: "OF", placeholder: "onlyfans.com/you" },
{ id: "fansly", label: "Fansly", abbr: "FL", placeholder: "fansly.com/you" },
{ id: "instagram", label: "Instagram", abbr: "IG", placeholder: "@yourhandle" },
];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLANK_VENUE = { club: "", city: "", days: [], hours: "", notes: "" };
const ADMIN_CREDS = { username: "tapped_admin", password: "SI@Parker2024!" };

const styles = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
--bg: #07090a; --surface: #0f1214; --surface2: #161a1d; --border: #1e2428;
--green: #4ade80; --green-dim: #22c55e; --gold: #d4a843;
--text: #f0f4f8; --text-dim: #8a9bb0; --text-muted: #4a5568;
--red: #f87171; --radius: 12px; --radius-sm: 8px;
}

body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; }
.app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; border-bottom: 1px solid var(--border); }
.logo { font-family: 'Syne', sans-serif; font-weight: 900; font-size: 22px; letter-spacing: 0.08em; color: var(--green); }
.tagline { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s ease; text-decoration: none; }
.btn-primary { background: var(--green); color: #000; width: 100%; }
.btn-primary:hover { background: var(--green-dim); }
.btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); width: 100%; }
.btn-outline:hover { border-color: var(--green); color: var(--green); }
.btn-ghost { background: transparent; color: var(--text-dim); padding: 8px 12px; font-size: 13px; }
.btn-ghost:hover { color: var(--text); }
.btn-danger { background: transparent; color: var(--red); border: 1px solid var(--red); width: 100%; }
.btn-sm { padding: 8px 14px; font-size: 13px; width: auto; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.field label { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
.field input, .field textarea, .field select { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 12px 14px; outline: none; transition: border-color 0.15s; width: 100%; }
.field input:focus, .field textarea:focus { border-color: var(--green); }
.field textarea { resize: vertical; min-height: 80px; }
.login-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; gap: 32px; }
.login-logo { text-align: center; }
.login-logo .wordmark { font-family: 'Syne', sans-serif; font-weight: 900; font-size: 48px; letter-spacing: 0.1em; color: var(--green); line-height: 1; }
.login-logo .sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); letter-spacing: 0.2em; text-transform: uppercase; margin-top: 6px; }
.login-form { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 0; }
.login-error { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); border-radius: var(--radius-sm); color: var(--red); font-size: 13px; padding: 10px 14px; margin-bottom: 16px; text-align: center; }
.nav { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 10; }
.nav-tab { flex: 1; padding: 14px 8px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
.nav-tab.active { color: var(--green); border-bottom-color: var(--green); }
.content { flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.profile-header { display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--surface); border-bottom: 1px solid var(--border); }
.profile-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--surface2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 900; font-size: 20px; color: var(--green); overflow: hidden; flex-shrink: 0; }
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-info h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; }
.profile-info .stage { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); }
.toggle-row:last-child { border-bottom: none; }
.toggle-label { display: flex; flex-direction: column; gap: 2px; }
.toggle-label span { font-size: 14px; font-weight: 500; }
.toggle-label small { font-size: 12px; color: var(--text-muted); }
.toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-slider { position: absolute; inset: 0; background: var(--border); border-radius: 12px; cursor: pointer; transition: 0.2s; }
.toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: var(--text-muted); border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: rgba(74,222,128,0.2); border: 1px solid var(--green); }
.toggle input:checked + .toggle-slider::before { background: var(--green); transform: translateX(20px); }
.pay-link-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.pay-link-row:last-child { border-bottom: none; }
.pay-abbr { width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.pay-link-row input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 9px 12px; outline: none; }
.pay-link-row input:focus { border-color: var(--green); }
.venue-card { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.venue-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.venue-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
.venue-city { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.btn-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px; line-height: 1; padding: 0 4px; flex-shrink: 0; }
.btn-remove:hover { color: var(--red); }
.days-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.day-chip { padding: 4px 10px; border-radius: 20px; font-family: 'DM Mono', monospace; font-size: 11px; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text-muted); transition: all 0.15s; }
.day-chip.selected { background: rgba(74,222,128,0.15); border-color: var(--green); color: var(--green); }
.public-profile { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; }
.public-hero { padding: 40px 24px 24px; text-align: center; border-bottom: 1px solid var(--border); }
.public-avatar { width: 88px; height: 88px; border-radius: 50%; background: var(--surface); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 900; font-size: 32px; color: var(--green); margin: 0 auto 16px; overflow: hidden; }
.public-avatar img { width: 100%; height: 100%; object-fit: cover; }
.public-name { font-family: 'Syne', sans-serif; font-weight: 900; font-size: 28px; margin-bottom: 8px; }
.public-bio { font-size: 14px; color: var(--text-dim); max-width: 300px; margin: 0 auto; line-height: 1.6; }
.public-section { padding: 24px; border-bottom: 1px solid var(--border); }
.section-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 14px; }
.pay-buttons { display: flex; flex-direction: column; gap: 10px; }
.pay-button { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: all 0.15s; text-decoration: none; color: var(--text); }
.pay-button:hover { border-color: var(--green); background: rgba(74,222,128,0.05); }
.pay-button-icon { width: 38px; height: 38px; border-radius: var(--radius-sm); background: var(--surface2); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--green); border: 1px solid var(--border); flex-shrink: 0; }
.pay-button-info { flex: 1; text-align: left; }
.pay-button-label { font-size: 13px; font-weight: 600; }
.pay-button-handle { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.pay-arrow { color: var(--text-muted); font-size: 16px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: flex-end; z-index: 100; padding: 0; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius) var(--radius) 0 0; padding: 28px 24px 40px; width: 100%; max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.modal-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; }
.disclaimer-text { font-size: 13px; color: var(--text-dim); line-height: 1.7; display: flex; flex-direction: column; gap: 10px; }
.disclaimer-clause { display: flex; gap: 10px; }
.disclaimer-clause::before { content: '•'; color: var(--green); flex-shrink: 0; margin-top: 1px; }
.timestamp { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); padding: 10px 14px; background: var(--surface2); border-radius: var(--radius-sm); border: 1px solid var(--border); }
.section-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; margin-bottom: 4px; }
.section-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.05em; }
.badge-green { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); color: var(--green); }
.badge-gold { background: rgba(212,168,67,0.1); border: 1px solid rgba(212,168,67,0.3); color: var(--gold); }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.save-bar { position: sticky; bottom: 0; background: var(--surface); border-top: 1px solid var(--border); padding: 14px 20px; display: flex; gap: 10px; }
.venues-list { display: flex; flex-direction: column; gap: 12px; }
.url-display { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text-muted); background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; word-break: break-all; }
.copy-btn { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 12px; padding: 6px 12px; cursor: pointer; font-family: 'DM Mono', monospace; white-space: nowrap; }
.copy-btn:hover { border-color: var(--green); color: var(--green); }
.url-row { display: flex; align-items: center; gap: 8px; }
.url-row .url-display { flex: 1; }
`;

function getPayUrl(platform, value) {
if (!value) return null;
const map = {
cashapp: `https://cash.app/${value.startsWith("$") ? value : "$" + value}`,
venmo: `https://venmo.com/${value.replace("@", "")}`,
zelle: `https://enroll.zellepay.com/`,
paypal: value.startsWith("http") ? value : `https://paypal.me/${value}`,
applepay: null,
onlyfans: value.startsWith("http") ? value : `https://onlyfans.com/${value}`,
fansly: value.startsWith("http") ? value : `https://fansly.com/${value}`,
instagram: `https://instagram.com/${value.replace("@", "")}`,
};
return map[platform] || null;
}

function DisclaimerModal({ name, onAccept }) {
const ts = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
return (
<div className="modal-overlay">
<div className="modal">
<div>
<div className="modal-title">Before You Tip {name}</div>
<div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Please read and acknowledge the following</div>
</div>
<div className="disclaimer-text">
<div className="disclaimer-clause">All tips are voluntary personal transactions between you and the performer.</div>
<div className="disclaimer-clause">You confirm you are of legal age to make this transaction in your jurisdiction.</div>
<div className="disclaimer-clause">All transactions are final and non-refundable. Tipping is a gift, not a purchase.</div>
<div className="disclaimer-clause">Initiating a chargeback or payment dispute for a voluntary tip may constitute fraud and can result in legal action.</div>
<div className="disclaimer-clause">No personal information is collected or stored from this interaction.</div>
<div className="disclaimer-clause">This platform (TAPPED / SI Parker Technologies) is not a party to this transaction and assumes no liability.</div>
</div>
<div className="timestamp">Acknowledged: {ts}</div>
<button className="btn btn-primary" onClick={onAccept}>I Understand — Continue to Tip</button>
</div>
</div>
);
}

function PublicProfile({ profile, onBack }) {
const [accepted, setAccepted] = useState(!profile.disclaimer_enabled);
const [showDisclaimer, setShowDisclaimer] = useState(profile.disclaimer_enabled);
const activePay = PAY_PLATFORMS.filter(p => profile.pay && profile.pay[p.id]);

function handlePayClick(platform) {
if (!accepted) { setShowDisclaimer(true); return; }
const url = getPayUrl(platform.id, profile.pay[platform.id]);
if (url) window.open(url, "_blank");
}

return (
<div className="public-profile">
{showDisclaimer && !accepted && (
<DisclaimerModal name={profile.stage_name} onAccept={() => { setAccepted(true); setShowDisclaimer(false); }} />
)}
<div className="header">
<div className="logo">TAPPED</div>
<div className="tagline">Protect Your Tips</div>
</div>
<div className="public-hero">
<div className="public-avatar">
{profile.photo_url ? <img src={profile.photo_url} alt={profile.stage_name} /> : (profile.stage_name || "?")[0]}
</div>
<div className="public-name">{profile.stage_name}</div>
{profile.bio && <div className="public-bio">{profile.bio}</div>}
<div style={{ marginTop: 12 }}>
<span className="badge badge-green"><span className="dot" />Protected</span>
</div>
</div>
{activePay.length > 0 && (
<div className="public-section">
<div className="section-label">Send a Tip</div>
<div className="pay-buttons">
{activePay.map(p => (
<button key={p.id} className="pay-button" onClick={() => handlePayClick(p)}>
<div className="pay-button-icon">{p.abbr}</div>
<div className="pay-button-info">
<div className="pay-button-label">{p.label}</div>
<div className="pay-button-handle">{profile.pay[p.id]}</div>
</div>
<span className="pay-arrow">›</span>
</button>
))}
</div>
</div>
)}
{profile.venues?.length > 0 && (
<div className="public-section">
<div className="section-label">Where to Find Me</div>
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{profile.venues.map((v, i) => (
<div key={i} className="card" style={{ padding: 14 }}>
<div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>{v.club}</div>
<div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{v.city}</div>
{v.days?.length > 0 && (
<div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
{v.days.map(d => (
<span key={d} style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, fontFamily: "DM Mono, monospace", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--green)" }}>{d}</span>
))}
</div>
)}
{v.hours && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{v.hours}</div>}
{v.notes && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{v.notes}</div>}
</div>
))}
</div>
</div>
)}
<div style={{ padding: "20px 24px", textAlign: "center" }}>
<div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>Protected by TAPPED · SI Parker Technologies</div>
</div>
{onBack && (
<div style={{ padding: "0 24px 32px" }}>
<button className="btn btn-ghost" onClick={onBack}>← Back to Dashboard</button>
</div>
)}
</div>
);
}

function Dashboard({ username, profile, onSave, onLogout, onPreview }) {
const [tab, setTab] = useState("profile");
const [draft, setDraft] = useState(JSON.parse(JSON.stringify(profile)));
const [saved, setSaved] = useState(false);
const fileRef = useRef();

function updateDraft(key, val) { setDraft(prev => ({ ...prev, [key]: val })); setSaved(false); }
function updatePay(id, val) { setDraft(prev => ({ ...prev, pay: { ...prev.pay, [id]: val } })); setSaved(false); }

async function handleSave() {
await onSave(draft);
setSaved(true);
setTimeout(() => setSaved(false), 2000);
}

function handlePhoto(e) {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = ev => updateDraft("photo_url", ev.target.result);
reader.readAsDataURL(file);
}

function addVenue() { updateDraft("venues", [...(draft.venues || []), { ...BLANK_VENUE }]); }
function updateVenue(i, key, val) { const u = [...(draft.venues || [])]; u[i] = { ...u[i], [key]: val }; updateDraft("venues", u); }
function toggleVenueDay(i, day) { const v = draft.venues[i]; const days = v.days.includes(day) ? v.days.filter(d => d !== day) : [...v.days, day]; updateVenue(i, "days", days); }
function removeVenue(i) { updateDraft("venues", draft.venues.filter((_, idx) => idx !== i)); }

const profileUrl = `${window.location.origin}/${username}`;

return (
<div className="app">
<div className="profile-header">
<div className="profile-avatar" onClick={() => fileRef.current.click()} style={{ cursor: "pointer" }}>
{draft.photo_url ? <img src={draft.photo_url} alt={draft.stage_name} /> : (draft.stage_name?.[0] || "?")}
</div>
<input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
<div className="profile-info">
<h2>{draft.stage_name || username}</h2>
<div className="stage">@{username}</div>
<span className="badge badge-green" style={{ marginTop: 6 }}><span className="dot" />Active</span>
</div>
<button className="btn btn-ghost btn-sm" onClick={onLogout}>Out</button>
</div>
<nav className="nav">
{["profile", "pay", "venues", "settings"].map(t => (
<button key={t} className={`nav-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>
))}
</nav>
<div className="content">
{tab === "profile" && (
<>
<div><div className="section-title">Your Profile</div><div className="section-sub">This is what fans see when they tap your chip</div></div>
<div className="field"><label>Stage Name</label><input value={draft.stage_name || ""} onChange={e => updateDraft("stage_name", e.target.value)} placeholder="Your stage name" /></div>
<div className="field"><label>Bio</label><textarea value={draft.bio || ""} onChange={e => updateDraft("bio", e.target.value)} placeholder="Add a headline or short bio..." /></div>
<div className="card">
<div className="section-label" style={{ marginBottom: 10 }}>Your Tap Link</div>
<div className="url-row">
<div className="url-display">{profileUrl}</div>
<button className="copy-btn" onClick={() => navigator.clipboard.writeText(profileUrl)}>Copy</button>
</div>
</div>
<button className="btn btn-outline" onClick={onPreview}>Preview Public Profile</button>
</>
)}
{tab === "pay" && (
<>
<div><div className="section-title">Pay Links</div><div className="section-sub">Add your tip platforms — leave blank to hide</div></div>
<div className="card">
{PAY_PLATFORMS.map(p => (
<div key={p.id} className="pay-link-row">
<div className="pay-abbr">{p.abbr}</div>
<input value={draft.pay?.[p.id] || ""} onChange={e => updatePay(p.id, e.target.value)} placeholder={p.placeholder} />
</div>
))}
</div>
</>
)}
{tab === "venues" && (
<>
<div><div className="section-title">Venues</div><div className="section-sub">Where fans can find you</div></div>
<div className="venues-list">
{(draft.venues || []).map((v, i) => (
<div key={i} className="venue-card">
<div className="venue-card-header">
<div><div className="venue-name">{v.club || "New Venue"}</div><div className="venue-city">{v.city}</div></div>
<button className="btn-remove" onClick={() => removeVenue(i)}>×</button>
</div>
<div className="field" style={{ marginBottom: 8 }}><label>Club Name</label><input value={v.club} onChange={e => updateVenue(i, "club", e.target.value)} placeholder="Club name" /></div>
<div className="field" style={{ marginBottom: 8 }}><label>City</label><input value={v.city} onChange={e => updateVenue(i, "city", e.target.value)} placeholder="City, State" /></div>
<div>
<label style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Days</label>
<div className="days-grid">{ALL_DAYS.map(d => <button key={d} className={`day-chip${v.days.includes(d) ? " selected" : ""}`} onClick={() => toggleVenueDay(i, d)}>{d}</button>)}</div>
</div>
<div className="field" style={{ marginBottom: 8 }}><label>Hours</label><input value={v.hours} onChange={e => updateVenue(i, "hours", e.target.value)} placeholder="e.g. 9pm–2am" /></div>
<div className="field" style={{ marginBottom: 0 }}><label>Notes</label><input value={v.notes} onChange={e => updateVenue(i, "notes", e.target.value)} placeholder="VIP info, booking notes..." /></div>
</div>
))}
</div>
<button className="btn btn-outline" onClick={addVenue}>+ Add Venue</button>
</>
)}
{tab === "settings" && (
<>
<div><div className="section-title">Settings</div><div className="section-sub">Control what fans see</div></div>
<div className="card">
<div className="toggle-row">
<div className="toggle-label"><span>Tip Disclaimer</span><small>Require acknowledgment before pay links open</small></div>
<label className="toggle"><input type="checkbox" checked={!!draft.disclaimer_enabled} onChange={e => updateDraft("disclaimer_enabled", e.target.checked)} /><span className="toggle-slider" /></label>
</div>
<div className="toggle-row">
<div className="toggle-label"><span>Anonymous Mode</span><small>Hide your name from analytics</small></div>
<label className="toggle"><input type="checkbox" checked={!!draft.anonymous_mode} onChange={e => updateDraft("anonymous_mode", e.target.checked)} /><span className="toggle-slider" /></label>
</div>
</div>
<div className="card">
<div className="section-label" style={{ marginBottom: 2 }}>Account</div>
<div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>Logged in as @{username}</div>
<button className="btn btn-danger btn-sm" onClick={onLogout}>Sign Out</button>
</div>
</>
)}
<div style={{ height: 80 }} />
</div>
<div className="save-bar">
<button className="btn btn-primary" onClick={handleSave}>{saved ? "✓ Saved" : "Save Changes"}</button>
</div>
</div>
);
}

function Login({ onLogin }) {
const [u, setU] = useState("");
const [p, setP] = useState("");
const [err, setErr] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin() {
setLoading(true);
setErr("");
if (u.toLowerCase() === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
onLogin(ADMIN_CREDS.username, null, true);
setLoading(false);
return;
}
const { data, error } = await supabase
.from("performers")
.select("*")
.eq("slug", u.toLowerCase())
.eq("password", p)
.single();
if (error || !data) {
setErr("Invalid username or password");
} else {
onLogin(data.slug, data, false);
}
setLoading(false);
}

return (
<div className="login-screen">
<div className="login-logo">
<div className="wordmark">TAPPED</div>
<div className="sub">Protect Your Tips</div>
</div>
<div className="login-form">
{err && <div className="login-error">{err}</div>}
<div className="field"><label>Username</label><input value={u} onChange={e => { setU(e.target.value); setErr(""); }} placeholder="your username" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
<div className="field"><label>Password</label><input type="password" value={p} onChange={e => { setP(e.target.value); setErr(""); }} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
<button className="btn btn-primary" onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
</div>
</div>
);
}

export default function App() {
const [session, setSession] = useState(null);
const [preview, setPreview] = useState(false);
const [publicProfile, setPublicProfile] = useState(null);
const [loading, setLoading] = useState(true);

const path = window.location.pathname;
const publicMatch = path.match(/^\/([^/]+)$/);

useEffect(() => {
if (publicMatch) {
const slug = publicMatch[1];
supabase.from("performers").select("*").eq("slug", slug).single()
.then(({ data }) => {
if (data) setPublicProfile(data);
setLoading(false);
});
} else {
setLoading(false);
}
}, []);

if (loading) return <><style>{styles}</style><div className="app" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}><div style={{ color: "var(--green)", fontFamily: "DM Mono, monospace" }}>Loading...</div></div></>;

if (publicProfile) {
return <><style>{styles}</style><PublicProfile profile={publicProfile} /></>;
}

async function handleSave(updatedProfile) {
const { slug, password, id, created_at, joined_at, ...updateData } = updatedProfile;
await supabase.from("performers").update(updateData).eq("slug", session.username);
setSession(prev => ({ ...prev, profile: updatedProfile }));
}

function handleLogin(username, profile, isAdmin) {
setSession({ username, profile, isAdmin });
}

function handleLogout() { setSession(null); setPreview(false); }

if (session?.isAdmin) return <><style>{styles}</style><AdminPanel onLogout={handleLogout} /></>;
if (preview && session) return <><style>{styles}</style><PublicProfile profile={session.profile} onBack={() => setPreview(false)} /></>;

return (
<>
<style>{styles}</style>
{!session
? <div className="app"><Login onLogin={handleLogin} /></div>
: <Dashboard username={session.username} profile={session.profile} onSave={handleSave} onLogout={handleLogout} onPreview={() => setPreview(true)} />
}
</>
);
}

function AdminPanel({ onLogout }) {
const [tab, setTab] = useState("users");
const [users, setUsers] = useState([]);
const [newUser, setNewUser] = useState({ username: "", password: "", name: "" });
const [msg, setMsg] = useState("");
const [deleteConfirm, setDeleteConfirm] = useState(null);

useEffect(() => { loadUsers(); }, []);

async function loadUsers() {
const { data } = await supabase.from("performers").select("*");
if (data) setUsers(data);
}

async function handleCreate() {
if (!newUser.username || !newUser.password || !newUser.name) { setMsg("All fields required."); return; }
const slug = newUser.username.toLowerCase().replace(/\s+/g, "");
const { error } = await supabase.from("performers").insert({
slug,
password: newUser.password,
stage_name: newUser.name,
name: newUser.name,
disclaimer_enabled: true,
anonymous_mode: false,
pay: {},
venues: [],
});
if (error) { setMsg(error.message); return; }
setNewUser({ username: "", password: "", name: "" });
setMsg(`✓ Account created: @${slug}`);
setTimeout(() => setMsg(""), 3000);
loadUsers();
}

async function handleDelete(slug) {
if (deleteConfirm !== slug) { setDeleteConfirm(slug); return; }
await supabase.from("performers").delete().eq("slug", slug);
setDeleteConfirm(null);
setMsg(`Deleted @${slug}`);
setTimeout(() => setMsg(""), 2000);
loadUsers();
}

const profileBase = `${window.location.origin}/`;

return (
<div className="app">
<div className="profile-header">
<div className="profile-avatar" style={{ background: "rgba(212,168,67,0.15)", border: "2px solid var(--gold)", color: "var(--gold)" }}>A</div>
<div className="profile-info">
<h2>Admin Panel</h2>
<div className="stage">SI Parker Technologies</div>
<span className="badge badge-gold" style={{ marginTop: 6 }}><span className="dot" />Admin</span>
</div>
<button className="btn btn-ghost btn-sm" onClick={onLogout}>Out</button>
</div>
<nav className="nav">
{["users", "create"].map(t => (
<button key={t} className={`nav-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
{t === "users" ? `Users (${users.length})` : "New User"}
</button>
))}
</nav>
<div className="content">
{msg && (
<div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: msg.startsWith("✓") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${msg.startsWith("✓") ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, color: msg.startsWith("✓") ? "var(--green)" : "var(--red)", fontSize: 13, fontFamily: "DM Mono, monospace" }}>{msg}</div>
)}
{tab === "users" && (
<>
<div><div className="section-title">All Accounts</div><div className="section-sub">Click a profile URL to preview</div></div>
{users.map(u => (
<div key={u.slug} className="card" style={{ gap: 12, display: "flex", flexDirection: "column" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
<div>
<div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>{u.stage_name || u.slug}</div>
<div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>@{u.slug}</div>
</div>
<button className="btn btn-sm" style={{ background: deleteConfirm === u.slug ? "rgba(248,113,113,0.15)" : "transparent", border: `1px solid ${deleteConfirm === u.slug ? "var(--red)" : "var(--border)"}`, color: deleteConfirm === u.slug ? "var(--red)" : "var(--text-muted)" }} onClick={() => handleDelete(u.slug)}>
{deleteConfirm === u.slug ? "Confirm?" : "Delete"}
</button>
</div>
<div className="url-row">
<div className="url-display" style={{ fontSize: 11 }}>{profileBase}{u.slug}</div>
<button className="copy-btn" onClick={() => { navigator.clipboard.writeText(`${profileBase}${u.slug}`); setMsg("✓ Copied!"); setTimeout(() => setMsg(""), 1500); }}>Copy</button>
</div>
<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
{Object.entries(u.pay || {}).filter(([, v]) => v).map(([k]) => (
<span key={k} className="badge badge-green" style={{ fontSize: 10 }}>{k}</span>
))}
{(u.venues || []).length > 0 && (
<span className="badge" style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "var(--gold)", fontSize: 10 }}>{u.venues.length} venue{u.venues.length > 1 ? "s" : ""}</span>
)}
</div>
</div>
))}
{users.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 14 }}>No accounts yet</div>}
</>
)}
{tab === "create" && (
<>
<div><div className="section-title">Create Account</div><div className="section-sub">For new TAPPED customers after purchase</div></div>
<div className="card">
<div className="field"><label>Stage Name</label><input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Destiny" /></div>
<div className="field"><label>Username (profile URL slug)</label><input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s+/g, "") }))} placeholder="e.g. destiny" /></div>
<div className="field" style={{ marginBottom: 0 }}><label>Temporary Password</label><input value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="They'll change this on first login" /></div>
</div>
{newUser.username && (
<div className="card" style={{ padding: 14 }}>
<div className="section-label" style={{ marginBottom: 6 }}>Profile URL Preview</div>
<div className="url-display">{profileBase}{newUser.username}</div>
</div>
)}
<button className="btn btn-primary" onClick={handleCreate}>Create Account</button>
</>
)}
<div style={{ height: 40 }} />
</div>
</div>
);
}
