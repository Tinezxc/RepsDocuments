/* ============================================================
   EarlyWatch — Demo Authentication Layer
   ------------------------------------------------------------
   Client-side only. Credentials live in this file, which is
   fine for a prototype/demo but NOT for production.
   Replace ewLogin() with a real API call before deployment.

   Accounts:
     Adviser    → carl.reyes@earlywatch.edu   / adviser123
     Instructor → james.cruz@earlywatch.edu   / instructor123
     Student    → alex.reyes@earlywatch.edu   / student123
   ============================================================ */

const EW_ACCOUNTS = [
  {
    role: "adviser",
    title: "Adviser",
    name: "Dr. Carl Domenic Reyes",
    initials: "DM",
    email: "carl.reyes@earlywatch.edu",
    password: "adviser123",
    redirect: "adviser-dashboard.html"
  },
  {
    role: "instructor",
    title: "Instructor",
    name: "Prof. James Cruz",
    initials: "PJ",
    email: "james.cruz@earlywatch.edu",
    password: "instructor123",
    redirect: "instructor-dashboard.html"
  },
  {
    role: "student",
    title: "Student",
    name: "Alex Reyes",
    initials: "AR",
    email: "alex.reyes@earlywatch.edu",
    password: "student123",
    redirect: "student-dashboard.html"
  }
];

const EW_SESSION_KEY = "earlywatch.session";

/* ------------------------------------------------------------
   Sign in
   Returns the matched account object, or null on failure.
   Also stores the session in sessionStorage.
   ------------------------------------------------------------ */
function ewLogin(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  const account = EW_ACCOUNTS.find(
    a =>
      a.email.toLowerCase() === normalizedEmail &&
      a.password === normalizedPassword
  );

  if (!account) {
    console.warn(
      "[EarlyWatch] Login failed for:",
      normalizedEmail,
      "— no matching account."
    );
    return null;
  }

  const session = {
    role: account.role,
    title: account.title,
    name: account.name,
    initials: account.initials,
    email: account.email
  };

  sessionStorage.setItem(EW_SESSION_KEY, JSON.stringify(session));
  console.info("[EarlyWatch] Signed in as", account.role, "→", account.redirect);
  return account;
}

/* ------------------------------------------------------------
   Session helpers
   ------------------------------------------------------------ */
function ewCurrentUser() {
  try {
    const raw = sessionStorage.getItem(EW_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function ewLogout() {
  sessionStorage.removeItem(EW_SESSION_KEY);
  window.location.href = "index.html";
}

/* ------------------------------------------------------------
   Role → dashboard mapping
   ------------------------------------------------------------ */
function ewRedirectFor(role) {
  const account = EW_ACCOUNTS.find(a => a.role === role);
  return account ? account.redirect : "index.html";
}

/* ------------------------------------------------------------
   Page guard
   • No session           → redirect to login (index.html)
   • Wrong role session   → redirect to that role's dashboard
   • Matching role        → allow page to load
   ------------------------------------------------------------ */
function ewGuard(requiredRole) {
  const user = ewCurrentUser();

  if (!user) {
    console.warn("[EarlyWatch] No session — redirecting to login.");
    window.location.replace("index.html");
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.warn(
      "[EarlyWatch] Role mismatch — signed in as",
      user.role,
      "but page requires",
      requiredRole + ". Redirecting."
    );
    window.location.replace(ewRedirectFor(user.role));
    return null;
  }

  return user;
}

/* ------------------------------------------------------------
   Paint sidebar user block
   Looks for [data-user-name], [data-user-role], [data-user-initials]
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

/* ------------------------------------------------------------
   Boot — runs on every page that includes this script
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
  ewPaintUser();
  if (window.lucide) lucide.createIcons();
});