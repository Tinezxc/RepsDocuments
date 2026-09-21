/* ============================================================
   EarlyWatch — Shared UI Behaviours  (FIXED)
   Depends on: db.js, risk.js, auth.js
   ============================================================ */

/* ---------- Helpers ---------- */
function ewEsc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])
  );
}

function ewRiskColorClass(level) {
  return { critical:"text-danger", high:"text-warning", medium:"text-info", low:"text-success" }[level];
}

function ewAttendanceBar(pct) {
  const level = pct < 60 ? "critical" : pct < 75 ? "high" : "low";
  return `
    <div class="attendance-cell">
      <div class="bar-container"><div class="bar-fill ${level}" style="width:${pct}%"></div></div>
      <span class="attendance-val">${pct}%</span>
    </div>`;
}

/* ============================================================
   MODAL SYSTEM
   ============================================================ */
function ewShowModal({ title, bodyHTML, footerHTML, width = 520 }) {
  const overlay = document.createElement("div");
  overlay.className = "ew-modal-overlay";
  overlay.innerHTML = `
    <div class="ew-modal" style="max-width:${width}px" role="dialog" aria-modal="true">
      <div class="ew-modal-header">
        <h2>${ewEsc(title)}</h2>
        <button type="button" class="ew-modal-close" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="ew-modal-body">${bodyHTML}</div>
      <div class="ew-modal-footer">${footerHTML || ""}</div>
    </div>`;

  document.body.appendChild(overlay);
  if (window.lucide) lucide.createIcons();

  let resolveClosed;
  const closed = new Promise(resolve => { resolveClosed = resolve; });

  let isClosed = false;
  function close(value) {
    if (isClosed) return;
    isClosed = true;
    overlay.classList.add("closing");
    setTimeout(() => overlay.remove(), 140);
    resolveClosed(value);
  }

  overlay.addEventListener("click", e => { if (e.target === overlay) close(null); });
  overlay.querySelector(".ew-modal-close").addEventListener("click", () => close(null));

  function onKey(e) {
    if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(null); }
  }
  document.addEventListener("keydown", onKey);

  return { overlay, close, closed };
}

function ewConfirm({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  const { overlay, close, closed } = ewShowModal({
    title,
    bodyHTML: `<p class="ew-modal-text">${body}</p>`,
    footerHTML: `
      <button type="button" class="ew-btn ew-btn-ghost" data-role="cancel">${ewEsc(cancelLabel)}</button>
      <button type="button" class="ew-btn ${danger ? "ew-btn-danger" : "ew-btn-primary"}"
              data-role="confirm">${ewEsc(confirmLabel)}</button>`,
    width: 440
  });

  overlay.querySelector('[data-role="cancel"]').onclick  = () => close(false);
  overlay.querySelector('[data-role="confirm"]').onclick = () => close(true);

  return closed;
}

/* ============================================================
   ADD STUDENT — public entry point
   Called directly by the button's inline onclick, so it works
   even if the document-level delegation never ran.
   ============================================================ */
async function ewOpenAddStudent(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (typeof ewStudentFormModal !== "function") {
    console.error("[EarlyWatch] ewStudentFormModal is not defined. Did app.js load?");
    alert("Could not open the form — the application scripts are missing.\n" +
          "Please refresh the page and check the browser console (F12).");
    return;
  }

  try {
    const created = await ewStudentFormModal(null);
    if (created) console.log("[EarlyWatch] Student added:", created);
  } catch (err) {
    console.error("[EarlyWatch] Add Student modal threw:", err);
    alert("Something went wrong opening the form.\n" +
          (err && err.message ? err.message + "\n" : "") +
          "See the browser console for details.");
  }
}
window.ewOpenAddStudent = ewOpenAddStudent;

/* ============================================================
   API HELPERS — fall back to a direct fetch when EW_DB methods
   are missing (e.g. an older db.js build).
   ============================================================ */
async function ewApiAddStudent(payload) {
  if (typeof EW_DB !== "undefined" && typeof EW_DB.addStudent === "function") {
    try {
      const res = await EW_DB.addStudent(payload);
      if (res) return res;
    } catch (err) {
      console.warn("[EarlyWatch] EW_DB.addStudent threw — trying a direct fetch instead.", err);
    }
  } else {
    console.warn("[EarlyWatch] EW_DB.addStudent not available — using a direct fetch.");
  }

  try {
    const res = await fetch("students.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }

    if (!res.ok) {
      const errors =
        (data && Array.isArray(data.errors) && data.errors) ||
        (data && data.error ? [data.error] : null) ||
        [`Server returned HTTP ${res.status}.`];
      return { ok: false, errors };
    }

    return { ok: true, student: data, fallback: true };
  } catch (err) {
    return { ok: false, errors: ["Network error: " + err.message] };
  }
}

/* ============================================================
   STUDENT FORM — name / ID / course / section / adviser only
   ============================================================ */
const EW_NEW_STUDENT_DEFAULTS = {
  gpa:            2.00,
  attendance:     100,
  missed:         0,
  failedSubjects: 0,
  caseStatus:     "Monitoring"
};

function ewNextStudentId() {
  const year = new Date().getFullYear();
  let used = new Set();
  try {
    if (typeof EW_DB !== "undefined" && EW_DB.students && typeof EW_DB.students.all === "function") {
      used = new Set(EW_DB.students.all().map(s => s.id));
    }
  } catch (e) {
    console.warn("[EarlyWatch] Could not read existing student IDs:", e);
  }
  let candidate;
  do {
    candidate = `${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  } while (used.has(candidate));
  return candidate;
}

function ewStudentFormModal(existing) {
  const isEdit = !!existing;
  const v = existing || {};

  const defaults = isEdit
    ? { id: v.id, name: v.name, course: v.course, section: v.section, adviser: v.adviser }
    : { id: ewNextStudentId() };

  const field = (name, label, type = "text", extra = "") => `
    <label class="ew-field">
      <span>${ewEsc(label)}</span>
      <input type="${type}" name="${name}"
             value="${defaults[name] != null ? ewEsc(defaults[name]) : ""}" ${extra}>
    </label>`;

  const bodyHTML = `
    <form id="ewStudentForm" novalidate>
      <div class="ew-form-error" hidden></div>
      <div class="ew-form-grid">
        ${field("name",    "Full name",  "text", "required")}
        ${field("id",      "Student ID", "text", `required ${isEdit ? "readonly" : ""}`)}
        ${field("course",  "Course",     "text")}
        ${field("section", "Section",    "text")}
        ${field("adviser", "Adviser",    "text")}
      </div>
    </form>`;

  const footerHTML = `
    <button type="button" class="ew-btn ew-btn-ghost" data-role="cancel">Cancel</button>
    <button type="button" class="ew-btn ew-btn-primary" data-role="save">
      ${isEdit ? "Save changes" : "Add student"}
    </button>`;

  const { overlay, close, closed } = ewShowModal({
    title: isEdit ? `Edit ${existing.name}` : "Add Student",
    bodyHTML, footerHTML, width: 560
  });

  const form    = overlay.querySelector("#ewStudentForm");
  const errBox  = overlay.querySelector(".ew-form-error");
  const saveBtn = overlay.querySelector('[data-role="save"]');

  overlay.querySelector('[data-role="cancel"]').onclick = () => close(null);

  const showError = msg => { errBox.textContent = msg; errBox.hidden = false; };

  async function save() {
    const data = Object.fromEntries(new FormData(form).entries());

    const errs = [];
    if (!data.name || !data.name.trim()) errs.push("Name is required.");
    if (!data.id   || !data.id.trim())   errs.push("Student ID is required.");
    if (errs.length) { showError(errs.join(" ")); return; }

    errBox.hidden = true;
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = isEdit ? "Saving…" : "Adding…";

    const payload = {
      name:    data.name.trim(),
      id:      data.id.trim(),
      course:  data.course  || "",
      section: data.section || "",
      adviser: data.adviser || ""
    };
    if (!isEdit) Object.assign(payload, EW_NEW_STUDENT_DEFAULTS);

    let result;
    try {
      if (isEdit) {
        result = (typeof EW_DB !== "undefined" && typeof EW_DB.updateStudent === "function")
          ? await EW_DB.updateStudent(existing.id, payload)
          : { ok: false, errors: ["Update is not supported by the current build."] };
      } else {
        result = await ewApiAddStudent(payload);
      }
    } catch (err) {
      console.error("[EarlyWatch] Save failed:", err);
      result = { ok: false, errors: ["Could not reach the server. Is Apache/PHP/MySQL running?"] };
    }

    if (!result || !result.ok) {
      const list = (result && result.errors) ? result.errors : ["Save failed."];
      showError(list.join(" "));
      saveBtn.disabled = false;
      saveBtn.textContent = original;
      return;
    }

    const created = result.student || null;
    close(created);

    // If we bypassed EW_DB, the local cache is stale — reload to show the new row.
    if (result.fallback) {
      setTimeout(() => window.location.reload(), 250);
    }
  }

  saveBtn.onclick = save;
  form.addEventListener("submit", e => { e.preventDefault(); save(); });

  // Focus the first editable field for a nicer UX
  const firstInput = overlay.querySelector("input:not([readonly])");
  if (firstInput) setTimeout(() => firstInput.focus(), 30);

  return closed;
}
window.ewStudentFormModal = ewStudentFormModal;

/* ============================================================
   RECORDS TABLE RENDERER
   ============================================================ */
function ewRenderRecordsTable(tbody, students) {
  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-muted" style="text-align:center;padding:2rem;">
      No students match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const r = EW_RISK.compute(s);
    const cls = ewRiskColorClass(r.level);
    const caseClass = s.caseStatus === "Open"       ? "text-danger"
                    : s.caseStatus === "Resolved"   ? "text-success"
                    : s.caseStatus === "Monitoring" ? "text-info"
                    : "text-warning";

    return `
      <tr class="clickable-row" data-student-id="${s.id}">
        <td>
          <div class="student-cell">
            <div class="avatar-initials bg-${r.level}">${ewEsc(s.initials)}</div>
            <div>
              <div class="student-name">${ewEsc(s.name)}</div>
              <div class="student-id">${s.id}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${ewEsc(s.course || "—")}</div>
          <div class="text-muted">${ewEsc(s.section || "—")}</div>
        </td>
        <td>
          <div class="risk-cell">
            <span class="tag tag-${r.level}">${r.label}</span>
            <span class="risk-score">${r.score}</span>
          </div>
        </td>
        <td class="${cls} font-bold">${Number(s.gpa).toFixed(2)}</td>
        <td>${ewAttendanceBar(s.attendance)}</td>
        <td class="${cls} font-bold">${s.missed}</td>
        <td class="${caseClass} font-bold">${ewEsc(s.caseStatus)}</td>
        <td class="text-muted">${ewEsc(s.adviser || "—")}</td>
        <td class="row-actions">
          <button type="button" class="icon-btn" data-action="edit"
                  data-student-id="${s.id}" title="Edit">
            <i data-lucide="pencil"></i>
          </button>
          <button type="button" class="icon-btn icon-danger" data-action="delete"
                  data-student-id="${s.id}" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>`;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

/* ============================================================
   RECORDS PAGE
   ============================================================ */
function ewInitRecordsPage() {
  const tbody   = document.querySelector("table tbody");
  const search  = document.querySelector(".search-box input");
  const filters = document.querySelectorAll(".filter-btn:not([data-action])");
  const sortSel = document.querySelector(".sort-dropdown select");
  const footer  = document.querySelector(".table-footer");

  if (!tbody) return;

  let query = "", level = "all", sortBy = "risk";

  function apply() {
    let rows = EW_DB.students.all();

    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        (s.course  || "").toLowerCase().includes(q) ||
        (s.section || "").toLowerCase().includes(q)
      );
    }

    if (level !== "all") rows = rows.filter(s => EW_RISK.compute(s).level === level);

    const sorters = {
      risk:       (a, b) => EW_RISK.compute(b).score - EW_RISK.compute(a).score,
      course:     (a, b) => (a.course  || "").localeCompare(b.course  || "") ||
                            (a.section || "").localeCompare(b.section || "") ||
                             a.name.localeCompare(b.name),
      gpa:        (a, b) => a.gpa - b.gpa,
      attendance: (a, b) => a.attendance - b.attendance,
      name:       (a, b) => a.name.localeCompare(b.name)
    };
    rows.sort(sorters[sortBy] || sorters.risk);

    ewRenderRecordsTable(tbody, rows);
    if (footer) footer.textContent = `Showing ${rows.length} of ${EW_DB.students.count()} students`;
  }

  if (search) search.addEventListener("input", e => { query = e.target.value.trim(); apply(); });

  filters.forEach(btn => btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    level = btn.textContent.trim().toLowerCase();
    apply();
  }));

  if (sortSel) sortSel.addEventListener("change", e => {
    const v = e.target.value.toLowerCase();
    sortBy = v.includes("course") ? "course"
           : v.includes("gpa")    ? "gpa"
           : v.includes("attend") ? "attendance"
           : v.includes("name")   ? "name"
           : "risk";
    apply();
  });

  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      e.stopPropagation();
      const id = btn.dataset.studentId;
      const student = EW_DB.students.get(id);
      if (!student) return;

      if (btn.dataset.action === "edit") {
        await ewStudentFormModal(student);
      }
      if (btn.dataset.action === "delete") {
        const alertCount = EW_DB.alerts.for(id).length;
        const ivCount    = EW_DB.interventions.for(id).length;
        const extra = (alertCount || ivCount)
          ? ` This will also remove ${alertCount} alert(s) and ${ivCount} intervention(s).`
          : "";
        const ok = await ewConfirm({
          title: `Delete ${student.name}?`,
          body:  `This cannot be undone.${extra}`,
          confirmLabel: "Delete",
          danger: true
        });
        if (ok) await EW_DB.deleteStudent(id);
      }
      return;
    }

    const row = e.target.closest("tr[data-student-id]");
    if (row) window.location.href = `student-profile.html?id=${row.dataset.studentId}`;
  });

  EW_DB.subscribe(apply);
  apply();
}

/* ============================================================
   GLOBAL "ADD STUDENT" HANDLER — document-level delegation
   Kept for any button on other pages that only uses
   data-action="add-student" (no inline onclick).
   ============================================================ */
(function wireAddStudentButton() {
  if (window.__ewAddStudentWired) return;
  window.__ewAddStudentWired = true;

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action='add-student']");
    if (!btn) return;

    // If the button has its own inline onclick, let that handle it.
    if (btn.hasAttribute("onclick")) return;

    ewOpenAddStudent(e);
  });
})();

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */
function ewInitDashboardPage() {
  const tbody = document.querySelector("#priorityTable");
  if (!tbody) return;

  function apply() {
    const all = EW_DB.students.all();

    const counts = { critical:0, high:0, medium:0, low:0 };
    let openCases = 0;
    all.forEach(s => {
      const lvl = EW_RISK.compute(s).level;
      counts[lvl] = (counts[lvl] || 0) + 1;
      if (s.caseStatus === "Open") openCases++;
    });

    const setText = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };

    setText("[data-metric='critical']", counts.critical);
    setText("[data-metric='high']",     counts.high);
    setText("[data-metric='medium']",   counts.medium);
    setText("[data-metric='open']",     openCases);

    const total = all.length || 1;
    const setBar = (sel, value) => {
      const el = document.querySelector(sel);
      if (el) el.style.width = Math.round((value / total) * 100) + "%";
    };
    setBar("[data-bar='critical']", counts.critical);
    setBar("[data-bar='high']",     counts.high);
    setBar("[data-bar='medium']",   counts.medium);
    setBar("[data-bar='low']",      counts.low);

    setText("[data-count='critical']", counts.critical);
    setText("[data-count='high']",     counts.high);
    setText("[data-count='medium']",   counts.medium);
    setText("[data-count='low']",      counts.low);

    const priority = all
      .slice()
      .sort((a, b) => EW_RISK.compute(b).score - EW_RISK.compute(a).score)
      .slice(0, 5);

    ewRenderRecordsTable(tbody, priority);
  }

  EW_DB.subscribe(apply);
  apply();
}

/* ============================================================
   ALERTS PAGE
   ============================================================ */
function ewInitAlertsPage() {
  const list = document.querySelector("#alertsList");
  if (!list) return;

  let tab = "unread";

  function render() {
    let alerts = EW_DB.alerts.all();
    if (tab === "unread") alerts = alerts.filter(a => !a.acknowledged);
    if (tab === "read")   alerts = alerts.filter(a =>  a.acknowledged);

    alerts.sort((a, b) => b.date.localeCompare(a.date));

    const unreadCount = EW_DB.alerts.unread().length;
    document.querySelectorAll(".tab").forEach(t => {
      if (t.dataset.tab === "unread") t.textContent = `Unread (${unreadCount})`;
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    const ackAllBtn = document.querySelector(".btn-acknowledge-all");
    if (ackAllBtn) {
      ackAllBtn.textContent = `Acknowledge all (${unreadCount})`;
      ackAllBtn.disabled = unreadCount === 0;
    }

    const counts = { critical:0, high:0, medium:0, low:0 };
    alerts.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1; });
    document.querySelectorAll("[data-alert-count]").forEach(el => {
      el.textContent = counts[el.dataset.alertCount] || 0;
    });

    if (!alerts.length) {
      list.innerHTML = `<div class="text-muted" style="padding:2rem;text-align:center;">
        No alerts in this view.</div>`;
      return;
    }

    list.innerHTML = alerts.map(a => {
      const student = EW_DB.students.get(a.studentId);
      const name = student ? student.name : "(deleted student)";
      return `
        <div class="alert-card alert-${a.severity}">
          <div class="alert-icon-wrapper">
            <i data-lucide="bell" class="alert-icon"></i>
          </div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="student-name">${ewEsc(name)}</span>
              <span class="alert-tag">${a.severity[0].toUpperCase() + a.severity.slice(1)} · ${ewEsc(a.kind)}</span>
              <span class="alert-date">${a.date}</span>
            </div>
            <p class="alert-message">${ewEsc(a.message)}</p>
          </div>
          ${a.acknowledged
            ? `<span class="text-muted" style="font-size:.72rem;">Acknowledged</span>`
            : `<button class="btn-ack" data-alert-id="${a.id}">Ack.</button>`}
        </div>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
  }

  list.addEventListener("click", e => {
    const btn = e.target.closest("[data-alert-id]");
    if (!btn) return;
    EW_DB.alerts.acknowledge(btn.dataset.alertId);
  });

  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      tab = t.dataset.tab || "unread";
      render();
    });
  });

  const ackAllBtn = document.querySelector(".btn-acknowledge-all");
  if (ackAllBtn) ackAllBtn.addEventListener("click", () => EW_DB.alerts.acknowledgeAll());

  EW_DB.subscribe(render);
  render();
}

/* ============================================================
   INTERVENTIONS PAGE
   ============================================================ */
function ewInitInterventionsPage() {
  const list = document.querySelector("#interventionsList");
  if (!list) return;

  function render() {
    const all = EW_DB.interventions.all()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));

    const pending   = all.filter(i => i.status === "pending").length;
    const effective = all.filter(i => i.status === "effective").length;
    const total     = all.length;

    const setText = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
    setText("[data-iv-metric='pending']",   pending);
    setText("[data-iv-metric='effective']", effective);
    setText("[data-iv-metric='total']",     total);

    const titleEl = document.querySelector("[data-iv-title]");
    if (titleEl) titleEl.textContent = `All Interventions (${total})`;

    if (!all.length) {
      list.innerHTML = `<div class="text-muted" style="padding:2rem;text-align:center;">
        No interventions logged yet.</div>`;
      return;
    }

    list.innerHTML = all.map(i => {
      const s = EW_DB.students.get(i.studentId);
      const name = s ? s.name : "(deleted student)";
      const risk = s ? EW_RISK.compute(s) : null;
      return `
        <div class="intervention-card">
          <div class="card-header">
            <div class="student-info">
              <span class="student-name">${ewEsc(name)}</span>
              ${risk ? `<span class="tag tag-${risk.level}">${risk.level}</span>` : ""}
              <div class="student-id">${i.studentId}</div>
            </div>
            <div class="card-badges">
              <span class="type-badge">${ewEsc(i.type)}</span>
              <span class="status-badge status-${i.status}">
                ${i.status === "effective" ? "Effective" : "Pending"}
              </span>
            </div>
          </div>
          <p class="intervention-desc">${ewEsc(i.action)}</p>
          <div class="card-footer">
            ${i.date} · By: ${ewEsc(i.assigned || "—")}
            ${i.deadline ? ` · Follow-up: <strong>${i.deadline}</strong>` : ""}
          </div>
        </div>`;
    }).join("");
  }

  EW_DB.subscribe(render);
  render();
}

/* ============================================================
   STUDENT SELF-VIEW DASHBOARD
   ============================================================ */
function ewInitStudentDashboard() {
  const root = document.querySelector("#studentRoot");
  if (!root) return;

  function render() {
    const user = ewCurrentUser();
    if (!user || !user.studentId) {
      root.innerHTML = `<p class="text-muted">No student record linked to this account.</p>`;
      return;
    }
    const s = EW_DB.students.get(user.studentId);
    if (!s) {
      root.innerHTML = `<p class="text-muted">Your student record could not be found.</p>`;
      return;
    }

    const risk = EW_RISK.compute(s);

    const bannerEl = document.querySelector("#riskBanner");
    if (bannerEl) {
      bannerEl.className = `risk-banner risk-banner-${risk.level}`;
      bannerEl.querySelector(".risk-title").textContent =
        `You are currently flagged as ${risk.label.toLowerCase()} academic risk`;
      bannerEl.querySelector(".risk-sub").textContent =
        risk.overrides.length
          ? `Triggered by: ${risk.overrides.join(", ")}. Your adviser has been notified.`
          : `Score: ${risk.score}/100. Your adviser has been notified.`;
    }

    const setText = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
    setText("[data-stu='gpa']",        Number(s.gpa).toFixed(2));
    setText("[data-stu='attendance']", s.attendance + "%");
    const passing = s.subjects.filter(x => (x.grade ?? 100) >= 75).length;
    setText("[data-stu='passing']",     `${passing}/${s.subjects.length}`);
    setText("[data-stu='passing-sub']", `${s.subjects.length - passing} at risk`);

    const subjects = document.querySelector("#studentSubjects");
    if (subjects) {
      subjects.innerHTML = s.subjects.map(sub => {
        const fail = sub.grade < 75;
        return `
          <div class="subject-card">
            <div class="subject-top">
              <div class="subject-left">
                <div class="subject-code-row">
                  <span class="subject-code">${sub.code}</span>
                  <span class="status-tag ${fail ? "status-failing" : "status-passing"}">
                    ${fail ? "At Risk" : "Passing"}
                  </span>
                </div>
                <div class="subject-name">${ewEsc(sub.name)}</div>
                <div class="subject-instructor">${ewEsc(sub.instructor || "—")}</div>
              </div>
              <div class="subject-grade ${fail ? "text-danger" : "text-success"}">${sub.grade ?? "—"}</div>
            </div>
            <div class="subject-stats">
              <div class="stat-tile"><div class="stat-value">${sub.prelim ?? "—"}</div><div class="stat-label">Prelim</div></div>
              <div class="stat-tile"><div class="stat-value">${sub.midterm ?? "—"}</div><div class="stat-label">Midterm</div></div>
              <div class="stat-tile"><div class="stat-value">${sub.attendance ?? 0}%</div><div class="stat-label">Attendance</div></div>
            </div>
          </div>`;
      }).join("");
    }
  }

  EW_DB.subscribe(render);
  render();
}