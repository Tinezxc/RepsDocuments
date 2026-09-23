/* ============================================================
   EarlyWatch — Auth layer (frontend only)
   Credentials checked against EW_DB.users.
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
});