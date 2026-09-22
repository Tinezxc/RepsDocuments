/* ============================================================
   EarlyWatch — Auth layer (PHP/MySQL)
   ============================================================ */

const EW_SESSION_KEY = "earlywatch.session";

const EW_ROLE_REDIRECT = {
  adviser:    "adviser-dashboard.html",
  instructor: "instructor-dashboard.html",
  student:    "student-dashboard.html"
};

/* ------------------------------------------------------------
   Login
   ------------------------------------------------------------ */
async function ewLogin(email, password) {
  const res = await fetch("login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) return null;

  const user = await res.json();

  sessionStorage.setItem(EW_SESSION_KEY, JSON.stringify({
    role:      user.role,
    title:     user.title,
    name:      user.name,
    initials:  user.initials,
    email:     user.email,
    studentId: user.studentId
  }));

  return {
    ...user,
    redirect: user.redirect || EW_ROLE_REDIRECT[user.role] || "index.html"
  };
}

/* ------------------------------------------------------------
   Register (student-only from the UI)
   ------------------------------------------------------------ */
async function ewRegister(data) {
  const res = await fetch("register.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors || ["Registration failed."] };
  return { ok: true };
}

/* ------------------------------------------------------------
   Forgot / Reset password
   ------------------------------------------------------------ */
async function ewForgotPassword(email) {
  const res = await fetch("forgot-password.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors || ["Request failed."] };
  return { ok: true, ...body };
}

async function ewResetPassword(token, password) {
  const res = await fetch("reset-password.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });
  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors || ["Reset failed."] };
  return { ok: true, ...body };
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

async function ewLogout() {
  // Clear client state.
  sessionStorage.removeItem(EW_SESSION_KEY);

  // Tell the server to destroy the session too.
  try {
    await fetch("logout.php", { method: "POST", credentials: "same-origin" });
  } catch (_) { /* offline is fine */ }

  // Replace (not assign) so the back button can't restore the dashboard.
  window.location.replace("index.html");
}

function ewRedirectFor(role) {
  return EW_ROLE_REDIRECT[role] || "index.html";
}

/* ------------------------------------------------------------
   Page guard + back-button trap
   ------------------------------------------------------------ */
function ewGuard(requiredRole) {
  const user = ewCurrentUser();

  if (!user) {
    window.location.replace("index.html");
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.replace(ewRedirectFor(user.role));
    return null;
  }

  // Block the back button from restoring cached protected pages.
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", function () {
    if (!ewCurrentUser()) {
      window.location.replace("index.html");
    } else {
      history.pushState(null, "", location.href);
    }
  });

  return user;
}

/* ------------------------------------------------------------
   Paint sidebar user block
   ------------------------------------------------------------ */
function ewPaintUser() {
  const user = ewCurrentUser();
  if (!user) return;

  document.querySelectorAll("[data-user-name]").forEach(el => {
    el.textContent = user.name;
  });
  document.querySelectorAll("[data-user-role]").forEach(el => {
    el.textContent = user.title;
  });
  document.querySelectorAll("[data-user-initials]").forEach(el => {
    el.textContent = user.initials;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  ewPaintUser();
  if (window.lucide) lucide.createIcons();
});