const TOKEN_KEY = "tapped_session";
const ROLE_KEY = "tapped_role";

export function getSession() {
  try {
    return { token: localStorage.getItem(TOKEN_KEY), role: localStorage.getItem(ROLE_KEY) };
  } catch {
    return { token: null, role: null };
  }
}

export function setSession(token, role) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ROLE_KEY, role || "");
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
    }
  } catch {}
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const { token } = getSession();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}
