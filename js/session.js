// ============================================================
// session.js
// ------------------------------------------------------------
// There is no Supabase Auth session here (see login_advisor()/
// the RPC-based login) — "being logged in" just means we're
// holding a plain advisor profile object in localStorage. This
// file is the ONE place that reads/writes/clears it, so every
// page agrees on the storage key and shape.
//
// Stored shape (matches what login_advisor() returns):
//   { id, full_name, email, district }
// Never store a password or password_hash here.
// ============================================================

const SESSION_KEY = 'advisor_data';

/**
 * Persist the advisor's session after a successful login.
 * @param {{id: string, full_name: string, email: string, district: string}} advisor
 */
export function saveSession(advisor) {
  if (!advisor || !advisor.id) {
    throw new Error('saveSession: advisor object with an id is required');
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(advisor));
}

/**
 * Read the current advisor session, if any.
 * @returns {{id: string, full_name: string, email: string, district: string} | null}
 */
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) {
      clearSession();
      return null;
    }
    return parsed;
  } catch (e) {
    // Corrupt/old data — don't let a bad localStorage value break every page silently
    clearSession();
    return null;
  }
}

/** Remove the current session (logout). */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Call at the top of any page that requires a logged-in advisor.
 * Redirects to the login page if there's no valid session.
 * @param {string} loginPageUrl - where to send the user if not logged in
 * @returns {{id: string, full_name: string, email: string, district: string} | null}
 *   Returns the advisor if present; returns null AND redirects if not
 *   (the null return lets calling code bail out early before redirect completes).
 */
export function requireSession(loginPageUrl = 'index.html') {
  const advisor = getSession();
  if (!advisor) {
    window.location.href = loginPageUrl;
    return null;
  }
  return advisor;
}
