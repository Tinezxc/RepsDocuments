/* ============================================================
   EarlyWatch — Adviser Profile Page
   Depends on: db.js, risk.js, app.js, auth.js
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     Compute adviser stats from DB
     ------------------------------------------------------------ */
  function computeAdviserStats() {
    const students = EW_DB.students.all();
    const alerts = EW_DB.alerts.all();
    const interventions = EW_DB.interventions.all();

    const totalStudents = students.length;
    const criticalCount = students.filter(s => EW_RISK.compute(s).level === "critical").length;
    const highCount     = students.filter(s => EW_RISK.compute(s).level === "high").length;
    const openCases     = students.filter(s => s.caseStatus === "Open").length;
    const resolvedCases = students.filter(s => s.caseStatus === "Resolved").length;

    const unreadAlerts = alerts.filter(a => !a.acknowledged).length;
    const totalInterventions = interventions.length;
    const effectiveInterventions = interventions.filter(i => i.status === "effective").length;

    const resolutionRate = totalStudents > 0
      ? Math.round((resolvedCases / totalStudents) * 100)
      : 0;

    const interventionSuccessRate = totalInterventions > 0
      ? Math.round((effectiveInterventions / totalInterventions) * 100)
      : 0;

    return {
      totalStudents,
      criticalCount,
      highCount,
      openCases,
      resolvedCases,
      unreadAlerts,
      totalInterventions,
      effectiveInterventions,
      resolutionRate,
      interventionSuccessRate
    };
  }

  /* ------------------------------------------------------------
     Activity feed
     ------------------------------------------------------------ */
  function generateActivityFeed() {
    const activities = [];
    const students = EW_DB.students.all();
    const alerts = EW_DB.alerts.all();
    const interventions = EW_DB.interventions.all();

    alerts
      .filter(a => !a.acknowledged)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .forEach(a => {
        const s = EW_DB.students.get(a.studentId);
        activities.push({
          icon: "bell",
          text: `New ${a.severity} alert for ${s ? s.name : "Unknown"}: ${a.kind}`,
          time: a.date
        });
      });

    interventions
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .forEach(i => {
        const s = EW_DB.students.get(i.studentId);
        activities.push({
          icon: "clipboard-list",
          text: `${i.type} logged for ${s ? s.name : "Unknown"} — ${i.status}`,
          time: i.date
        });
      });

    students
      .filter(s => s.caseStatus === "Open" || s.caseStatus === "In-Progress")
      .slice(0, 2)
      .forEach(s => {
        activities.push({
          icon: "user",
          text: `${s.name} case is ${s.caseStatus.toLowerCase()}`,
          time: "Recently"
        });
      });

    activities.sort((a, b) => {
      const dateA = a.time === "Recently" ? "9999-99-99" : a.time;
      const dateB = b.time === "Recently" ? "9999-99-99" : b.time;
      return dateB.localeCompare(dateA);
    });

    return activities.slice(0, 5);
  }

  /* ------------------------------------------------------------
     Avatar HTML (image or initials)
     ------------------------------------------------------------ */
  function renderAvatar(profile) {
    const hasImage = !!profile.avatarImage;
    const styleAttr = hasImage
      ? `style="background-image:url('${profile.avatarImage}')"`
      : "";

    return `
      <div class="avatar-uploader">
        <div class="avatar-xl ${hasImage ? "avatar-with-image" : ""}" ${styleAttr}>
          ${hasImage ? "" : ewEsc(profile.initials)}
        </div>
        <label class="avatar-edit-btn" title="Change photo">
          <i data-lucide="camera"></i>
          <input type="file" accept="image/*" id="avatarFileInput">
        </label>
      </div>
      ${hasImage
        ? `<button type="button" class="avatar-remove-btn" data-action="remove-avatar">Remove photo</button>`
        : ""}
    `;
  }

  /* ------------------------------------------------------------
     Render the profile page
     ------------------------------------------------------------ */
  function renderProfile(root, profile, handlers) {
    const stats = computeAdviserStats();
    const activities = generateActivityFeed();

    const navBadge = document.getElementById("navAlertCount");
    if (navBadge) navBadge.textContent = stats.unreadAlerts;

    const activityItems = activities.length
      ? activities.map(a => `
          <div class="activity-item">
            <div class="activity-icon"><i data-lucide="${a.icon}"></i></div>
            <div class="activity-content">
              <div class="activity-text">${ewEsc(a.text)}</div>
              <div class="activity-time">${ewEsc(a.time)}</div>
            </div>
          </div>`).join("")
      : `<p class="text-muted">No recent activity.</p>`;

    root.innerHTML = `
      <header class="header profile-header">
        <div class="profile-identity">
          <div>${renderAvatar(profile)}</div>
          <div>
            <h1>${ewEsc(profile.name)}</h1>
            <p class="subtitle">${ewEsc(profile.position)} · ${ewEsc(profile.department)}</p>
            <div class="profile-badge">
              <i data-lucide="shield-check"></i>
              ${ewEsc(profile.title)} Account
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button type="button" class="ew-btn ew-btn-ghost" data-action="edit-profile">
            <i data-lucide="pencil"></i> Edit Profile
          </button>
        </div>
      </header>

      <section class="metrics-grid profile-metrics">
        <div class="metric-card">
          <div class="metric-value">${stats.totalStudents}</div>
          <div class="metric-label">Assigned Students</div>
          <div class="metric-sub">Under your advisement</div>
        </div>
        <div class="metric-card critical">
          <div class="metric-value">${stats.criticalCount}</div>
          <div class="metric-label">Critical Risk</div>
          <div class="metric-sub">Immediate attention</div>
        </div>
        <div class="metric-card high">
          <div class="metric-value">${stats.highCount}</div>
          <div class="metric-label">High Risk</div>
          <div class="metric-sub">Intervention underway</div>
        </div>
        <div class="metric-card open-cases">
          <div class="metric-value">${stats.openCases}</div>
          <div class="metric-label">Open Cases</div>
          <div class="metric-sub">${stats.resolvedCases} resolved</div>
        </div>
      </section>

      <div class="profile-grid">
        <section class="panel">
          <h3><i data-lucide="user"></i> Personal Information</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label"><i data-lucide="mail"></i> Email</span>
              <span class="info-value">${ewEsc(profile.email)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="phone"></i> Phone</span>
              <span class="info-value">${ewEsc(profile.phone)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="badge"></i> Employee ID</span>
              <span class="info-value">${ewEsc(profile.employeeId)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="building"></i> Department</span>
              <span class="info-value">${ewEsc(profile.department)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="door-open"></i> Office</span>
              <span class="info-value">${ewEsc(profile.office)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="clock"></i> Office Hours</span>
              <span class="info-value">${ewEsc(profile.officeHours)}</span>
            </div>
          </div>
        </section>

        <section class="panel">
          <h3><i data-lucide="graduation-cap"></i> Professional Details</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label"><i data-lucide="award"></i> Education</span>
              <span class="info-value">${ewEsc(profile.education)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="target"></i> Specialization</span>
              <span class="info-value">${ewEsc(profile.specialization)}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i data-lucide="calendar"></i> Joined</span>
              <span class="info-value">${ewEsc(profile.joinedDate)}</span>
            </div>
          </div>
        </section>

        <section class="panel panel-full">
          <h3><i data-lucide="bar-chart-3"></i> Advising Performance</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value text-success">${stats.resolutionRate}%</div>
              <div class="stat-label">Case Resolution Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-info">${stats.interventionSuccessRate}%</div>
              <div class="stat-label">Intervention Success Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.totalInterventions}</div>
              <div class="stat-label">Total Interventions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.unreadAlerts}</div>
              <div class="stat-label">Unread Alerts</div>
            </div>
          </div>
        </section>

        <section class="panel panel-full">
          <h3><i data-lucide="activity"></i> Recent Activity</h3>
          <div class="activity-list">${activityItems}</div>
        </section>

        <section class="panel panel-full">
          <h3><i data-lucide="file-text"></i> About</h3>
          <p class="ew-modal-text">${ewEsc(profile.bio)}</p>
        </section>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    ewPaintUser();

    const fileInput = root.querySelector("#avatarFileInput");
    if (fileInput) {
      fileInput.addEventListener("change", e => {
        const file = e.target.files && e.target.files[0];
        if (file) handlers.onAvatarFile(file);
        fileInput.value = "";
      });
    }
  }

  /* ------------------------------------------------------------
     Image processing (resize → JPEG data URL)
     ------------------------------------------------------------ */
  function processImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file."));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Image is too large. Max 5 MB."));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Invalid image file."));
        img.onload = () => {
          const MAX = 400;
          let { width, height } = img;
          if (width > height && width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          try {
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch (err) {
            reject(new Error("Could not process the image."));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ------------------------------------------------------------
     Edit Profile modal
     ------------------------------------------------------------ */
  function openEditProfileModal(currentProfile) {
    const bodyHTML = `
      <form id="ewAdviserProfileForm" novalidate>
        <div class="ew-form-error" hidden></div>
        <div class="ew-form-grid">
          <label class="ew-field">
            <span>Full Name</span>
            <input type="text" name="name" value="${ewEsc(currentProfile.name)}" required>
          </label>
          <label class="ew-field">
            <span>Position</span>
            <input type="text" name="position" value="${ewEsc(currentProfile.position)}">
          </label>
          <label class="ew-field">
            <span>Department</span>
            <input type="text" name="department" value="${ewEsc(currentProfile.department)}">
          </label>
          <label class="ew-field">
            <span>Employee ID</span>
            <input type="text" name="employeeId" value="${ewEsc(currentProfile.employeeId)}">
          </label>
          <label class="ew-field">
            <span>Email</span>
            <input type="email" name="email" value="${ewEsc(currentProfile.email)}">
          </label>
          <label class="ew-field">
            <span>Phone</span>
            <input type="tel" name="phone" value="${ewEsc(currentProfile.phone)}">
          </label>
          <label class="ew-field">
            <span>Office</span>
            <input type="text" name="office" value="${ewEsc(currentProfile.office)}">
          </label>
          <label class="ew-field">
            <span>Office Hours</span>
            <input type="text" name="officeHours" value="${ewEsc(currentProfile.officeHours)}">
          </label>
          <label class="ew-field">
            <span>Education</span>
            <input type="text" name="education" value="${ewEsc(currentProfile.education)}">
          </label>
          <label class="ew-field">
            <span>Specialization</span>
            <input type="text" name="specialization" value="${ewEsc(currentProfile.specialization)}">
          </label>
          <label class="ew-field" style="grid-column: 1 / -1;">
            <span>Bio</span>
            <textarea name="bio" rows="3" style="width:100%;padding:0.6rem 0.75rem;background:#0d1118;border:1px solid var(--border-color,#232834);border-radius:8px;color:#fff;font-family:inherit;font-size:0.85rem;resize:vertical;outline:none;">${ewEsc(currentProfile.bio)}</textarea>
          </label>
        </div>
      </form>`;

    const footerHTML = `
      <button type="button" class="ew-btn ew-btn-ghost" data-role="cancel">Cancel</button>
      <button type="button" class="ew-btn ew-btn-primary" data-role="save">Save Changes</button>`;

    const { overlay, close, closed } = ewShowModal({
      title: "Edit Profile",
      bodyHTML,
      footerHTML,
      width: 620
    });

    const form = overlay.querySelector("#ewAdviserProfileForm");
    const errBox = overlay.querySelector(".ew-form-error");
    const saveBtn = overlay.querySelector('[data-role="save"]');

    overlay.querySelector('[data-role="cancel"]').onclick = () => close(null);

    function showError(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
    }

    async function save() {
      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || !data.name.trim()) {
        showError("Name is required.");
        return;
      }

      errBox.hidden = true;
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      const updated = {
        ...currentProfile,
        ...data,
        name: data.name.trim(),
        initials: data.name.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("")
      };

      const res = EW_DB.adviserProfile.save(updated);

      if (!res.ok) {
        showError("Could not save profile. Please try again.");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes";
        return;
      }

      close(res.profile);
    }

    saveBtn.onclick = save;
    form.addEventListener("submit", e => { e.preventDefault(); save(); });

    const firstInput = overlay.querySelector('input[name="name"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 30);

    return closed;
  }

  /* ------------------------------------------------------------
     Page initializer
     ------------------------------------------------------------ */
  window.ewInitAdviserProfilePage = function () {
    const root = document.getElementById("profileRoot");
    if (!root) return;

    const user = ewCurrentUser();
    if (!user) return;

    function rerender() {
      const profile = EW_DB.adviserProfile.get(user);
      renderProfile(root, profile, handlers);
      ewApplyAvatar();  // keep sidebar avatar in sync too
    }

    const handlers = {
      async onAvatarFile(file) {
        try {
          const dataUrl = await processImageFile(file);
          EW_DB.adviserProfile.saveAvatar(dataUrl);
          rerender();
        } catch (err) {
          alert(err.message || "Could not update your photo.");
        }
      }
    };

    root.addEventListener("click", async e => {
      const editBtn = e.target.closest("[data-action='edit-profile']");
      if (editBtn) {
        const current = EW_DB.adviserProfile.get(user);
        const updated = await openEditProfileModal(current);
        if (updated) rerender();
        return;
      }

      const removeBtn = e.target.closest("[data-action='remove-avatar']");
      if (removeBtn) {
        EW_DB.adviserProfile.removeAvatar();
        rerender();
        return;
      }
    });

    EW_DB.subscribe(rerender);
    rerender();
  };
})();