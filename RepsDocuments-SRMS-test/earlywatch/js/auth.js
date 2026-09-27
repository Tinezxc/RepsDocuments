/* ============================================================
   EarlyWatch — Auth layer (frontend only)
   Credentials checked against EW_DB.users.
   Session kept in sessionStorage.
   ============================================================ */

const EW_SESSION_KEY = "earlywatch.session";

const EW_ROLE_REDIRECT = {
  admin:      "admin-dashboard.html",
  adviser:    "adviser-dashboard.html",
  instructor: "instructor-dashboard.html",
  student:    "student-dashboard.html"
};

/* ------------------------------------------------------------
   Login
   ------------------------------------------------------------ */
async function ewLogin(email, password) {
  const user = EW_DB.users.find(email);
  if (!user || user.password !== password) return null;

  // Block unverified accounts
  if (user.role === "student" && user.verified === false) {
    sessionStorage.setItem("earlywatch.pendingVerify", JSON.stringify({ email: user.email }));
    window.location.href = "verify.html";
    return null;
  }

  sessionStorage.setItem(EW_SESSION_KEY, JSON.stringify({
    role:      user.role,
    title:     user.title,
    name:      user.name,
    initials:  user.initials,
    email:     user.email,
    studentId: user.studentId
  }));

  return {
    role:      user.role,
    title:     user.title,
    name:      user.name,
    initials:  user.initials,
    email:     user.email,
    studentId: user.studentId,
    redirect:  EW_ROLE_REDIRECT[user.role] || "index.html"
  };
}

/* ------------------------------------------------------------
   Register (student-only from the UI)
   ------------------------------------------------------------ */
async function ewRegister(data) {
  const errors = [];

  const firstName = (data.firstName || "").trim();
  const lastName  = (data.lastName  || "").trim();
  const fullName  = (data.name || [firstName, lastName].filter(Boolean).join(" ")).trim();

  if (!firstName) errors.push("First name is required.");
  if (!lastName)  errors.push("Last name is required.");
  if (!data.gender) errors.push("Gender / Sex is required.");
  if (!data.address || !data.address.trim()) errors.push("Address is required.");
  if (!data.email || !data.email.trim()) errors.push("Email address is required.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Please enter a valid email address.");
  if (!data.studentId || !data.studentId.trim()) errors.push("School ID is required.");
  if (!data.password) errors.push("Password is required.");
  else if (data.password.length < 6) errors.push("Password must be at least 6 characters.");
  if (errors.length) return { ok: false, errors };

  const initials = (function () {
    let out = "";
    if (firstName) out += firstName[0].toUpperCase();
    if (lastName)  out += lastName[0].toUpperCase();
    return out || "??";
  })();

  const result = EW_DB.users.add({
    role:      "student",
    title:     "Student",
    name:      fullName,
    firstName: firstName,
    lastName:  lastName,
    initials:  initials,
    gender:    data.gender,
    address:   data.address.trim(),
    email:     data.email.trim().toLowerCase(),
    password:  data.password,
    studentId: data.studentId.trim()
  });

  if (!result.ok) return result;
  return { ok: true };
}

/* ------------------------------------------------------------
   Session helpers
   ------------------------------------------------------------ */
function ewCurrentUser() {
  try {
    const raw = sessionStorage.getItem(EW_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) { return null; }
}

/* ------------------------------------------------------------
   Logout — replaces history entry so Back cannot return
   to a protected page
   ------------------------------------------------------------ */
function ewLogout() {
  // 1) Prevent the browser from caching the current page in bfcache
  try {
    window.addEventListener("pagehide", function blockCache(e) {
      // Some browsers accept a return value; modern browsers use event.preventDefault
      // to opt out of bfcache when the page is being frozen.
      e.preventDefault && e.preventDefault();
    });
  } catch (_) {}

  // 2) Clear the session
  sessionStorage.removeItem(EW_SESSION_KEY);
  sessionStorage.removeItem("earlywatch.pendingVerify");
  sessionStorage.removeItem("earlywatch.resetSession");

  // 3) Clear any in-memory user state markers (if pages set them)
  window.__ewLoggedOut = true;

  // 4) Replace the current history entry — Back won't return to this page
  //    because we're replacing it, not pushing a new entry.
  window.location.replace("index.html");
}

function ewRedirectFor(role) {
  return EW_ROLE_REDIRECT[role] || "index.html";
}

/* ------------------------------------------------------------
   Guard result cache — we only want ONE redirect per navigation
   ------------------------------------------------------------ */
let _ewGuardHandled = false;

/* ------------------------------------------------------------
   Page guard — accepts a single role OR an array of allowed roles
   Also listens to `pageshow` so bfcache restores are re-checked.
   ------------------------------------------------------------ */
function ewGuard(requiredRole) {
  const user = ewCurrentUser();

  // Normalise to an array
  const allowed = Array.isArray(requiredRole)
    ? requiredRole
    : (requiredRole ? [requiredRole] : null);

  function enforce() {
    if (_ewGuardHandled) return null;

    const current = ewCurrentUser();

    if (!current) {
      _ewGuardHandled = true;
      // replace() so the protected page is not kept in history
      window.location.replace("index.html");
      return null;
    }

    if (allowed && !allowed.includes(current.role)) {
      _ewGuardHandled = true;
      window.location.replace(ewRedirectFor(current.role));
      return null;
    }

    return current;
  }

  // 1) Enforce immediately on script load
  const initial = enforce();
  if (!initial) return null;

  // 2) Re-check whenever the page is shown — including bfcache restores
  //    via the browser Back/Forward buttons.
  window.addEventListener("pageshow", function (e) {
    // e.persisted === true when restored from bfcache
    if (!ewCurrentUser()) {
      _ewGuardHandled = true;
      window.location.replace("index.html");
    } else if (allowed) {
      const u = ewCurrentUser();
      if (!u || !allowed.includes(u.role)) {
        _ewGuardHandled = true;
        window.location.replace(ewRedirectFor(u ? u.role : "student"));
      }
    }
  });

  // 3) Re-check when the tab becomes visible again after being hidden
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && !ewCurrentUser()) {
      _ewGuardHandled = true;
      window.location.replace("index.html");
    }
  });

  // 4) Belt-and-braces: periodic session heartbeat (every 1s)
  //    Catches the rare case where a browser silently restores without
  //    firing pageshow (older Safari builds).
  const hb = setInterval(function () {
    if (!ewCurrentUser()) {
      clearInterval(hb);
      _ewGuardHandled = true;
      window.location.replace("index.html");
    }
  }, 1000);

  return initial;
}

/* ------------------------------------------------------------
   Resolve current avatar image (returns data URL or null)
   ------------------------------------------------------------ */
function ewResolveAvatarImage(user) {
  if (!user) return null;
  try {
    if (typeof EW_DB === "undefined" || !EW_DB.adviserProfile) return null;
    if (user.role !== "adviser") return null;
    const profile = EW_DB.adviserProfile.get(user);
    return profile && profile.avatarImage ? profile.avatarImage : null;
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------
   Apply avatar image to every [data-user-initials] element
   ------------------------------------------------------------ */
function ewApplyAvatar() {
  const user = ewCurrentUser();
  if (!user) return;

  const avatarImage = ewResolveAvatarImage(user);

  document.querySelectorAll("[data-user-initials]").forEach(function (el) {
    if (avatarImage) {
      el.classList.add("avatar-with-image");
      el.style.backgroundImage = `url("${avatarImage}")`;
      el.textContent = "";
    } else {
      el.classList.remove("avatar-with-image");
      el.style.backgroundImage = "";
      el.textContent = user.initials;
    }
  });
}

/* ------------------------------------------------------------
   Paint sidebar user block
   ------------------------------------------------------------ */
function ewPaintUser() {
  const user = ewCurrentUser();
  if (!user) return;

  document.querySelectorAll("[data-user-name]").forEach(function (el) {
    el.textContent = user.name;
  });
  document.querySelectorAll("[data-user-role]").forEach(function (el) {
    el.textContent = user.title;
  });

  ewApplyAvatar();
}

/* ------------------------------------------------------------
   Boot: paint user + refresh avatar whenever profile changes
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
  ewPaintUser();
  if (window.lucide) lucide.createIcons();

  // Keep sidebar avatar in sync with profile edits across the app
  if (typeof EW_DB !== "undefined" && EW_DB.subscribe) {
    EW_DB.subscribe(function () {
      ewApplyAvatar();
    });
  }
});

/* Also react to cross-tab storage changes */
window.addEventListener("storage", function (e) {
  if (e.key === "earlywatch.adviserProfile") {
    ewApplyAvatar();
  }
  if (e.key === EW_SESSION_KEY && !e.newValue) {
    // Another tab logged out — mirror it here
    window.location.replace("index.html");
  }
});

/* ------------------------------------------------------------
   Password policy
   ------------------------------------------------------------
   Rules:
     • No minimum length (any length allowed)
     • Must contain at least one symbol from a broad set
   ------------------------------------------------------------ */
const EW_PASSWORD_SYMBOL_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

function ewValidatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Password is required.");
    return { ok: false, errors };
  }

  // No minimum length — but still cap it at a sane max to avoid
  // pathological input. 128 chars is plenty for a demo.
  if (password.length > 128) {
    errors.push("Password must be 128 characters or fewer.");
  }

  // Must contain at least one symbol
  if (!EW_PASSWORD_SYMBOL_RE.test(password)) {
    errors.push("Password must include at least one symbol (e.g. ! @ # $ % ^ & *).");
  }

  return { ok: errors.length === 0, errors };
}

window.ewValidatePassword = ewValidatePassword;


/* ------------------------------------------------------------
   School ID format:  CC-DEPT-YY-NNNN
     CC    = 2-digit campus/college code (e.g. 01)
     DEPT  = 3–5 uppercase letters (e.g. COLL, CCS, BSIT)
     YY    = 2-digit year (e.g. 24)
     NNNN  = 4-digit sequential number
   Example:  01-COLL-24-2742
   ------------------------------------------------------------ */
const EW_SCHOOL_ID_RE = /^[0-9]{2}-[A-Z]{3,5}-[0-9]{2}-[0-9]{4}$/;

function ewValidateSchoolId(id) {
  const errors = [];
  const value = String(id || "").trim();

  if (!value) {
    errors.push("School ID is required.");
    return { ok: false, errors };
  }

  if (!EW_SCHOOL_ID_RE.test(value)) {
    errors.push("School ID must follow the format 01-COLL-24-2742.");
  }

  return { ok: errors.length === 0, errors };
}

/* Suggests the next ID in the given prefix, e.g. suggestNextSchoolId("01-COLL-24") */
function ewSuggestSchoolId(prefix) {
  const year2 = String(new Date().getFullYear()).slice(-2);
  const base = prefix || `01-COLL-${year2}`;

  // Look at existing users to find the highest suffix for this prefix
  let maxSuffix = 1000;
  try {
    if (typeof EW_DB !== "undefined" && EW_DB.users && EW_DB.users.all) {
      EW_DB.users.all().forEach(u => {
        const sid = String(u.studentId || "");
        if (sid.startsWith(base + "-")) {
          const tail = parseInt(sid.split("-").pop(), 10);
          if (!isNaN(tail) && tail > maxSuffix) maxSuffix = tail;
        }
      });
    }
  } catch (_) { /* ignore */ }

  const next = String(maxSuffix + 1).padStart(4, "0");
  return `${base}-${next}`;
}

/* Auto-format a partially typed ID as the user types:
     "01coll2427"  →  "01-COLL-24-27"  (best effort)
   Returns the formatted string. */
function ewFormatSchoolIdInput(raw) {
  const clean = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Segment the string: [2 digits][letters][2 digits][digits]
  const parts = [];
  let rest = clean;

  let m = rest.match(/^(\d{2})/);
  if (m) { parts.push(m[1]); rest = rest.slice(2); }

  m = rest.match(/^([A-Z]{1,5})/);
  if (m) { parts.push(m[1]); rest = rest.slice(m[1].length); }

  m = rest.match(/^(\d{2})/);
  if (m) { parts.push(m[1]); rest = rest.slice(2); }

  m = rest.match(/^(\d{1,4})/);
  if (m) { parts.push(m[1]); }

  return parts.join("-");
}

window.ewValidateSchoolId = ewValidateSchoolId;
window.ewSuggestSchoolId  = ewSuggestSchoolId;
window.ewFormatSchoolIdInput = ewFormatSchoolIdInput;