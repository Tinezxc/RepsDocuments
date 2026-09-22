/* ============================================================
   EarlyWatch — Auth layer (PHP/MySQL)
   Login and register hit api/login.php and api/register.php.
   Session kept in sessionStorage.
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
  const res = await fetch("api/login.php", {
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
   Register (student-only from the UI, but accepts any role)
   ------------------------------------------------------------ */
async function ewRegister(data) {
  const res = await fetch("api/register.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors || ["Registration failed."] };
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

function ewLogout() {
  sessionStorage.removeItem(EW_SESSION_KEY);
  window.location.href = "index.html";
}

function ewRedirectFor(role) {
  return EW_ROLE_REDIRECT[role] || "index.html";
}

/* ------------------------------------------------------------
   Page guard
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