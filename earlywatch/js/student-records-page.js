/* ================================================================
   EarlyWatch — Student Records page (self-contained)
   ================================================================ */
(function () {
  "use strict";

  /* Path to the API. Must resolve relative to student-records.html.
     If your PHP file lives in a subfolder, change this to e.g. "api/students.php". */
  const API = "students.php";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, c =>
      ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])
    );
  }

  let students = [];
  let query    = "";
  let level    = "all";
  let sortBy   = "risk";

  function computeRisk(s) {
    const gpaScore        = Math.max(0, Math.min(100, (3.0 - Number(s.gpa || 3.0)) / 2.0 * 100));
    const attendanceScore = Math.max(0, 100 - Number(s.attendance || 0));
    const missedScore     = Math.min(100, Number(s.missed || 0) * 8);
    const failedScore     = Math.min(100, Number(s.failed_subjects || s.failedSubjects || 0) * 25);

    const score = Math.round(
      gpaScore * 0.40 +
      attendanceScore * 0.35 +
      missedScore * 0.15 +
      failedScore * 0.10
    );

    let lvl = "low";
    if (score >= 75)      lvl = "critical";
    else if (score >= 55) lvl = "high";
    else if (score >= 35) lvl = "medium";

    return { score, level: lvl, label: lvl.charAt(0).toUpperCase() + lvl.slice(1) };
  }

  function attendanceBar(pct) {
    const lvl = pct < 60 ? "critical" : pct < 75 ? "high" : "low";
    return `
      <div class="attendance-cell">
        <div class="bar-container"><div class="bar-fill ${lvl}" style="width:${pct}%"></div></div>
        <span class="attendance-val">${pct}%</span>
      </div>`;
  }

  function render() {
    const tbody  = $("#recordsTbody");
    const footer = $("#recordsFooter");

    let rows = students.slice();

    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(s =>
        (s.name    || "").toLowerCase().includes(q) ||
        (s.id      || "").toLowerCase().includes(q) ||
        (s.course  || "").toLowerCase().includes(q) ||
        (s.section || "").toLowerCase().includes(q)
      );
    }
    if (level !== "all") {
      rows = rows.filter(s => computeRisk(s).level === level);
    }

    const sorters = {
      risk:       (a, b) => computeRisk(b).score - computeRisk(a).score,
      course:     (a, b) => (a.course || "").localeCompare(b.course || "") ||
                            (a.section || "").localeCompare(b.section || "") ||
                             (a.name || "").localeCompare(b.name || ""),
      gpa:        (a, b) => Number(a.gpa || 0) - Number(b.gpa || 0),
      attendance: (a, b) => Number(a.attendance || 0) - Number(b.attendance || 0),
      name:       (a, b) => (a.name || "").localeCompare(b.name || "")
    };
    rows.sort(sorters[sortBy] || sorters.risk);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted"
        style="text-align:center;padding:2rem;">No students match your filters.</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(s => {
        const r   = computeRisk(s);
        const cls = { critical:"text-danger", high:"text-warning",
                      medium:"text-info",     low:"text-success" }[r.level];
        const caseClass = s.case_status === "Open"       ? "text-danger"
                        : s.case_status === "Resolved"   ? "text-success"
                        : s.case_status === "Monitoring" ? "text-info"
                        : "text-warning";
        const initials = s.initials ||
          (s.name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

        return `
          <tr class="clickable-row" data-student-id="${esc(s.id)}">
            <td>
              <div class="student-cell">
                <div class="avatar-initials bg-${r.level}">${esc(initials)}</div>
                <div>
                  <div class="student-name">${esc(s.name)}</div>
                  <div class="student-id">${esc(s.id)}</div>
                </div>
              </div>
            </td>
            <td>
              <div>${esc(s.course || "—")}</div>
              <div class="text-muted">${esc(s.section || "—")}</div>
            </td>
            <td>
              <div class="risk-cell">
                <span class="tag tag-${r.level}">${r.label}</span>
                <span class="risk-score">${r.score}</span>
              </div>
            </td>
            <td class="${cls} font-bold">${Number(s.gpa || 0).toFixed(2)}</td>
            <td>${attendanceBar(Number(s.attendance || 0))}</td>
            <td class="${cls} font-bold">${Number(s.missed || 0)}</td>
            <td class="${caseClass} font-bold">${esc(s.case_status || "Monitoring")}</td>
            <td class="text-muted">${esc(s.adviser || "—")}</td>
            <td class="row-actions">
              <button type="button" class="icon-btn icon-danger" data-action="delete"
                      data-student-id="${esc(s.id)}" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          </tr>`;
      }).join("");
    }

    footer.textContent = `Showing ${rows.length} of ${students.length} students`;
    if (window.lucide) lucide.createIcons();
  }

  async function loadStudents() {
    try {
      const res  = await fetch(API, { headers: { "Accept": "application/json" } });
      const text = await res.text();

      let data;
      try { data = JSON.parse(text); }
      catch {
        const hint = /<title>\s*404/i.test(text)
          ? " — students.php was not found at this URL. Make sure students.php is in the same folder as student-records.html."
          : /<title>\s*500/i.test(text)
          ? " — students.php crashed. Check the Apache error log."
          : "";
        throw new Error("students.php did not return JSON" + hint +
                        "\nURL tried: " + new URL(API, location.href).href +
                        "\nFirst bytes: " + text.slice(0, 120).replace(/\s+/g, " "));
      }

      if (!res.ok) throw new Error((data && data.error) || ("HTTP " + res.status));
      if (!Array.isArray(data)) throw new Error("students.php did not return an array.");

      students = data;
      render();
    } catch (err) {
      console.error("[EarlyWatch] loadStudents failed:", err);
      $("#recordsTbody").innerHTML =
        `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#ff8a8a;">
           Could not load students.<br>
           <span class="text-muted" style="font-size:.78rem;white-space:pre-wrap;">${esc(err.message)}</span>
         </td></tr>`;
    }
  }

  function showModal({ title, bodyHTML, footerHTML, width = 520 }) {
    const overlay = document.createElement("div");
    overlay.className = "ew-modal-overlay";
    overlay.innerHTML = `
      <div class="ew-modal" style="max-width:${width}px" role="dialog" aria-modal="true">
        <div class="ew-modal-header">
          <h2>${esc(title)}</h2>
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
    const closed = new Promise(r => { resolveClosed = r; });
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
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(null); }
    });

    return { overlay, close, closed };
  }

  function nextStudentId() {
    const year = new Date().getFullYear();
    const used = new Set(students.map(s => s.id));
    let candidate;
    do {
      candidate = `${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    } while (used.has(candidate));
    return candidate;
  }

  function openAddStudentModal() {
    const suggestedId = nextStudentId();

    const bodyHTML = `
      <form id="ewStudentForm" novalidate>
        <div class="ew-form-error" hidden></div>
        <div class="ew-form-grid">
          <label class="ew-field">
            <span>Full name</span>
            <input type="text" name="name" required>
          </label>
          <label class="ew-field">
            <span>Student ID</span>
            <input type="text" name="id" value="${esc(suggestedId)}" required>
          </label>
          <label class="ew-field">
            <span>Course</span>
            <input type="text" name="course">
          </label>
          <label class="ew-field">
            <span>Section</span>
            <input type="text" name="section">
          </label>
          <label class="ew-field">
            <span>Adviser</span>
            <input type="text" name="adviser">
          </label>
        </div>
      </form>`;

    const footerHTML = `
      <button type="button" class="ew-btn ew-btn-ghost" data-role="cancel">Cancel</button>
      <button type="button" class="ew-btn ew-btn-primary" data-role="save">Add student</button>`;

    const { overlay, close } = showModal({
      title: "Add Student",
      bodyHTML, footerHTML, width: 560
    });

    const form    = overlay.querySelector("#ewStudentForm");
    const errBox  = overlay.querySelector(".ew-form-error");
    const saveBtn = overlay.querySelector('[data-role="save"]');

    overlay.querySelector('[data-role="cancel"]').onclick = () => close(null);

    setTimeout(() => {
      const i = form.querySelector('input[name="name"]');
      if (i) i.focus();
    }, 30);

    function showError(msg) { errBox.textContent = msg; errBox.hidden = false; }

    async function save() {
      const data = Object.fromEntries(new FormData(form).entries());

      const errs = [];
      if (!data.name || !data.name.trim()) errs.push("Name is required.");
      if (!data.id   || !data.id.trim())   errs.push("Student ID is required.");
      if (errs.length) { showError(errs.join(" ")); return; }

      errBox.hidden = true;
      saveBtn.disabled = true;
      const original = saveBtn.textContent;
      saveBtn.textContent = "Adding…";

      const payload = {
        name:           data.name.trim(),
        id:             data.id.trim(),
        course:         data.course  || "",
        section:        data.section || "",
        adviser:        data.adviser || "",
        gpa:            2.00,
        attendance:     100,
        missed:         0,
        failedSubjects: 0,
        caseStatus:     "Monitoring"
      };

      let res, text, json;
      try {
        res  = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });
        text = await res.text();
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      } catch (netErr) {
        saveBtn.disabled = false;
        saveBtn.textContent = original;
        showError("Network error: " + netErr.message);
        return;
      }

      if (!res.ok) {
        const list =
          (json && Array.isArray(json.errors) && json.errors) ||
          (json && json.error ? [json.error] : null) ||
          [`Server returned HTTP ${res.status}. Raw: ${text.slice(0, 160)}`];
        saveBtn.disabled = false;
        saveBtn.textContent = original;
        showError(list.join(" "));
        return;
      }

      close(json);
      await loadStudents();
    }

    saveBtn.onclick = save;
    form.addEventListener("submit", e => { e.preventDefault(); save(); });
  }

  $("#addStudentBtn").addEventListener("click", e => {
    e.preventDefault();
    openAddStudentModal();
  });

  $$("#filterGroup .filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$("#filterGroup .filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      level = btn.dataset.level || "all";
      render();
    });
  });

  $("#searchInput").addEventListener("input", e => { query = e.target.value.trim(); render(); });
  $("#sortSelect").addEventListener("change", e => { sortBy = e.target.value; render(); });

  $("#recordsTbody").addEventListener("click", async e => {
    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      e.stopPropagation();
      const id = delBtn.dataset.studentId;
      if (!confirm("Delete student " + id + "?\nThis cannot be undone.")) return;

      try {
        const res = await fetch(API + "?id=" + encodeURIComponent(id), { method: "DELETE" });
        const t   = await res.text();
        if (!res.ok) {
          alert("Delete failed: HTTP " + res.status + "\n" + t.slice(0, 200));
          return;
        }
        await loadStudents();
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
      return;
    }

    const row = e.target.closest("tr[data-student-id]");
    if (row) {
      window.location.href = "student-profile.html?id=" + encodeURIComponent(row.dataset.studentId);
    }
  });

  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try { await fetch("logout.php", { method: "POST" }); } catch (_) {}
      window.location.href = "login.html";
    });
  }

  loadStudents();
  if (window.lucide) lucide.createIcons();
})();