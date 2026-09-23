/* ============================================================
   EarlyWatch — Local Data Layer (no backend)
   Persists to localStorage. Same public API as before so the
   rest of the app keeps working unchanged.
   ============================================================ */

const EW_STORAGE_KEY = "earlywatch.db.v1";

/* ---------- Seed data ---------- */
const EW_SEED = {
  students: [
    {
      id: "2023-10001",
      name: "Alex Reyes",
      initials: "AR",
      course: "BS Information Technology",
      section: "BSIT 3-A",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 1.55,
      attendance: 58,
      missed: 11,
      failedSubjects: 3,
      caseStatus: "Open",
      subjects: [
        { code: "IT301", name: "Data Structures & Algorithms", instructor: "Prof. Jovic Lanao", grade: 72, prelim: 70, midterm: 74, attendance: 55 },
        { code: "IT302", name: "Database Management Systems",  instructor: "Prof. Maria Santos", grade: 78, prelim: 76, midterm: 80, attendance: 62 },
        { code: "IT303", name: "Web Systems & Technologies",   instructor: "Prof. James Cruz",  grade: 68, prelim: 66, midterm: 70, attendance: 54 },
        { code: "GE301", name: "Ethics",                       instructor: "Prof. Liza Tan",    grade: 85, prelim: 84, midterm: 86, attendance: 70 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 42 },
        { term: "2nd Sem 2024", risk: 55 },
        { term: "1st Sem 2025", risk: 71 },
        { term: "2nd Sem 2025", risk: 78 },
        { term: "1st Sem 2026", risk: 88 }
      ],
      notes: [
        { date: "2026-09-10", author: "Dr. Carl Domenic Reyes", text: "Met with Alex to discuss failing grades. He cited family responsibilities affecting study time." },
        { date: "2026-09-14", author: "Dr. Carl Domenic Reyes", text: "Referred to guidance office for counseling sessions every Wednesday." }
      ]
    },
    {
      id: "2023-10002",
      name: "Jomar Pantas",
      initials: "JP",
      course: "BS Computer Science",
      section: "BSCS 3-B",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 1.90,
      attendance: 66,
      missed: 7,
      failedSubjects: 2,
      caseStatus: "In-Progress",
      subjects: [
        { code: "CS301", name: "Operating Systems",        instructor: "Prof. Jovic Lanao", grade: 74, prelim: 72, midterm: 76, attendance: 64 },
        { code: "CS302", name: "Software Engineering",     instructor: "Prof. Maria Santos", grade: 79, prelim: 78, midterm: 80, attendance: 68 },
        { code: "CS303", name: "Artificial Intelligence",  instructor: "Prof. James Cruz",  grade: 71, prelim: 70, midterm: 72, attendance: 66 },
        { code: "GE302", name: "Technical Writing",        instructor: "Prof. Liza Tan",    grade: 82, prelim: 81, midterm: 83, attendance: 70 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 30 },
        { term: "2nd Sem 2024", risk: 38 },
        { term: "1st Sem 2025", risk: 50 },
        { term: "2nd Sem 2025", risk: 62 },
        { term: "1st Sem 2026", risk: 70 }
      ],
      notes: [
        { date: "2026-09-08", author: "Dr. Carl Domenic Reyes", text: "Jomar is struggling with OS concepts. Set up weekly tutoring with senior students." }
      ]
    },
    {
      id: "2023-10003",
      name: "Mika Dela Cruz",
      initials: "MD",
      course: "BS Information Systems",
      section: "BSIS 3-A",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 2.35,
      attendance: 78,
      missed: 4,
      failedSubjects: 1,
      caseStatus: "Monitoring",
      subjects: [
        { code: "IS301", name: "Systems Analysis & Design", instructor: "Prof. Maria Santos", grade: 80, prelim: 79, midterm: 81, attendance: 78 },
        { code: "IS302", name: "Business Process Mgmt",     instructor: "Prof. James Cruz",  grade: 77, prelim: 76, midterm: 78, attendance: 80 },
        { code: "IS303", name: "Enterprise Architecture",   instructor: "Prof. Jovic Lanao", grade: 74, prelim: 73, midterm: 75, attendance: 76 },
        { code: "GE303", name: "Philippine History",        instructor: "Prof. Liza Tan",    grade: 88, prelim: 87, midterm: 89, attendance: 82 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 22 },
        { term: "2nd Sem 2024", risk: 28 },
        { term: "1st Sem 2025", risk: 34 },
        { term: "2nd Sem 2025", risk: 40 },
        { term: "1st Sem 2026", risk: 44 }
      ],
      notes: [
        { date: "2026-09-05", author: "Dr. Carl Domenic Reyes", text: "Mika is on track but attendance dipped slightly. Monitoring continues." }
      ]
    },
    {
      id: "2023-10004",
      name: "Renz Villanueva",
      initials: "RV",
      course: "BS Information Technology",
      section: "BSIT 3-A",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 2.85,
      attendance: 91,
      missed: 1,
      failedSubjects: 0,
      caseStatus: "Resolved",
      subjects: [
        { code: "IT301", name: "Data Structures & Algorithms", instructor: "Prof. Jovic Lanao", grade: 86, prelim: 85, midterm: 87, attendance: 92 },
        { code: "IT302", name: "Database Management Systems",  instructor: "Prof. Maria Santos", grade: 88, prelim: 87, midterm: 89, attendance: 90 },
        { code: "IT303", name: "Web Systems & Technologies",   instructor: "Prof. James Cruz",  grade: 90, prelim: 89, midterm: 91, attendance: 93 },
        { code: "GE301", name: "Ethics",                       instructor: "Prof. Liza Tan",    grade: 89, prelim: 88, midterm: 90, attendance: 91 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 18 },
        { term: "2nd Sem 2024", risk: 15 },
        { term: "1st Sem 2025", risk: 12 },
        { term: "2nd Sem 2025", risk: 10 },
        { term: "1st Sem 2026", risk: 8 }
      ],
      notes: [
        { date: "2026-08-30", author: "Dr. Carl Domenic Reyes", text: "Renz has improved significantly. Case resolved." }
      ]
    },
    {
      id: "2023-10005",
      name: "Sofia Mendoza",
      initials: "SM",
      course: "BS Computer Science",
      section: "BSCS 3-B",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 1.70,
      attendance: 55,
      missed: 10,
      failedSubjects: 2,
      caseStatus: "Open",
      subjects: [
        { code: "CS301", name: "Operating Systems",        instructor: "Prof. Jovic Lanao", grade: 70, prelim: 68, midterm: 72, attendance: 52 },
        { code: "CS302", name: "Software Engineering",     instructor: "Prof. Maria Santos", grade: 73, prelim: 72, midterm: 74, attendance: 56 },
        { code: "CS303", name: "Artificial Intelligence",  instructor: "Prof. James Cruz",  grade: 68, prelim: 66, midterm: 70, attendance: 54 },
        { code: "GE302", name: "Technical Writing",        instructor: "Prof. Liza Tan",    grade: 80, prelim: 79, midterm: 81, attendance: 60 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 45 },
        { term: "2nd Sem 2024", risk: 58 },
        { term: "1st Sem 2025", risk: 66 },
        { term: "2nd Sem 2025", risk: 75 },
        { term: "1st Sem 2026", risk: 84 }
      ],
      notes: [
        { date: "2026-09-11", author: "Dr. Carl Domenic Reyes", text: "Sofia is at serious risk. Coordinating with parents for a conference next week." }
      ]
    },
    {
      id: "2023-10006",
      name: "Kyla Bautista",
      initials: "KB",
      course: "BS Information Systems",
      section: "BSIS 3-A",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 2.10,
      attendance: 82,
      missed: 3,
      failedSubjects: 0,
      caseStatus: "Monitoring",
      subjects: [
        { code: "IS301", name: "Systems Analysis & Design", instructor: "Prof. Maria Santos", grade: 82, prelim: 81, midterm: 83, attendance: 82 },
        { code: "IS302", name: "Business Process Mgmt",     instructor: "Prof. James Cruz",  grade: 80, prelim: 79, midterm: 81, attendance: 84 },
        { code: "IS303", name: "Enterprise Architecture",   instructor: "Prof. Jovic Lanao", grade: 79, prelim: 78, midterm: 80, attendance: 80 },
        { code: "GE303", name: "Philippine History",        instructor: "Prof. Liza Tan",    grade: 90, prelim: 89, midterm: 91, attendance: 85 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 25 },
        { term: "2nd Sem 2024", risk: 30 },
        { term: "1st Sem 2025", risk: 32 },
        { term: "2nd Sem 2025", risk: 35 },
        { term: "1st Sem 2026", risk: 34 }
      ],
      notes: [
        { date: "2026-09-06", author: "Dr. Carl Domenic Reyes", text: "Kyla is stable. Continue regular check-ins." }
      ]
    },
    {
      id: "2023-10007",
      name: "Marco Aquino",
      initials: "MA",
      course: "BS Information Technology",
      section: "BSIT 3-B",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 2.60,
      attendance: 88,
      missed: 2,
      failedSubjects: 0,
      caseStatus: "Resolved",
      subjects: [
        { code: "IT301", name: "Data Structures & Algorithms", instructor: "Prof. Jovic Lanao", grade: 84, prelim: 83, midterm: 85, attendance: 88 },
        { code: "IT302", name: "Database Management Systems",  instructor: "Prof. Maria Santos", grade: 85, prelim: 84, midterm: 86, attendance: 90 },
        { code: "IT303", name: "Web Systems & Technologies",   instructor: "Prof. James Cruz",  grade: 86, prelim: 85, midterm: 87, attendance: 89 },
        { code: "GE301", name: "Ethics",                       instructor: "Prof. Liza Tan",    grade: 88, prelim: 87, midterm: 89, attendance: 87 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 20 },
        { term: "2nd Sem 2024", risk: 18 },
        { term: "1st Sem 2025", risk: 15 },
        { term: "2nd Sem 2025", risk: 12 },
        { term: "1st Sem 2026", risk: 11 }
      ],
      notes: []
    },
    {
      id: "2023-10008",
      name: "Liza Fernandez",
      initials: "LF",
      course: "BS Computer Science",
      section: "BSCS 3-A",
      adviser: "Dr. Carl Domenic Reyes",
      gpa: 1.85,
      attendance: 72,
      missed: 5,
      failedSubjects: 1,
      caseStatus: "In-Progress",
      subjects: [
        { code: "CS301", name: "Operating Systems",        instructor: "Prof. Jovic Lanao", grade: 76, prelim: 75, midterm: 77, attendance: 72 },
        { code: "CS302", name: "Software Engineering",     instructor: "Prof. Maria Santos", grade: 78, prelim: 77, midterm: 79, attendance: 74 },
        { code: "CS303", name: "Artificial Intelligence",  instructor: "Prof. James Cruz",  grade: 73, prelim: 72, midterm: 74, attendance: 70 },
        { code: "GE302", name: "Technical Writing",        instructor: "Prof. Liza Tan",    grade: 82, prelim: 81, midterm: 83, attendance: 75 }
      ],
      history: [
        { term: "1st Sem 2024", risk: 32 },
        { term: "2nd Sem 2024", risk: 42 },
        { term: "1st Sem 2025", risk: 50 },
        { term: "2nd Sem 2025", risk: 55 },
        { term: "1st Sem 2026", risk: 58 }
      ],
      notes: [
        { date: "2026-09-09", author: "Dr. Carl Domenic Reyes", text: "Liza is improving. Attendance plan in place." }
      ]
    }
  ],

  alerts: [
    { id: "a_001", studentId: "2023-10001", severity: "critical", kind: "Attendance",  message: "Attendance dropped to 58% — below the 60% threshold.", date: "2026-09-15", acknowledged: false },
    { id: "a_002", studentId: "2023-10001", severity: "critical", kind: "Grades",      message: "3 failed subjects this term. Immediate intervention required.", date: "2026-09-14", acknowledged: false },
    { id: "a_003", studentId: "2023-10005", severity: "critical", kind: "GPA",         message: "GPA fell to 1.70 — below the 1.75 minimum.", date: "2026-09-14", acknowledged: false },
    { id: "a_004", studentId: "2023-10005", severity: "high",     kind: "Attendance",  message: "Attendance is 55% — 10 missed activities so far.", date: "2026-09-13", acknowledged: false },
    { id: "a_005", studentId: "2023-10002", severity: "high",     kind: "Grades",      message: "2 failed subjects detected in midterm evaluation.", date: "2026-09-12", acknowledged: false },
    { id: "a_006", studentId: "2023-10008", severity: "high",     kind: "Attendance",  message: "Attendance at 72% — approaching critical threshold.", date: "2026-09-12", acknowledged: false },
    { id: "a_007", studentId: "2023-10003", severity: "medium",   kind: "Grades",      message: "Grade in IS303 dropped below 75.", date: "2026-09-11", acknowledged: false },
    { id: "a_008", studentId: "2023-10006", severity: "medium",   kind: "Attendance",  message: "Attendance slipped to 82% this month.", date: "2026-09-10", acknowledged: true  },
    { id: "a_009", studentId: "2023-10004", severity: "low",      kind: "Note",        message: "Case resolved. Continue positive reinforcement.", date: "2026-09-08", acknowledged: true  }
  ],

  interventions: [
    { id: "i_001", studentId: "2023-10001", type: "Counseling",       status: "pending",   assigned: "Dr. Carl Domenic Reyes", action: "Weekly counseling sessions every Wednesday at 2PM to address family-related stress.", date: "2026-09-14", deadline: "2026-10-15" },
    { id: "i_002", studentId: "2023-10001", type: "Academic Coaching", status: "pending",   assigned: "Prof. Jovic Lanao",       action: "One-on-one tutoring for IT301 and IT303 twice a week.", date: "2026-09-12", deadline: "2026-10-01" },
    { id: "i_003", studentId: "2023-10002", type: "Tutoring",          status: "pending",   assigned: "Prof. Maria Santos",      action: "Senior-peer tutoring for Operating Systems every Friday.", date: "2026-09-08", deadline: "2026-10-10" },
    { id: "i_004", studentId: "2023-10005", type: "Parent Conference", status: "pending",   assigned: "Dr. Carl Domenic Reyes", action: "Parent-teacher conference to discuss attendance and grades.", date: "2026-09-15", deadline: "2026-09-25" },
    { id: "i_005", studentId: "2023-10008", type: "Academic Coaching", status: "effective", assigned: "Prof. James Cruz",        action: "Bi-weekly check-ins. Attendance improved from 65% to 72%.", date: "2026-08-20", deadline: "2026-09-20" },
    { id: "i_006", studentId: "2023-10004", type: "Mentoring",         status: "effective", assigned: "Prof. Liza Tan",          action: "Mentoring sessions concluded. Student is now thriving.", date: "2026-07-15", deadline: "2026-08-30" }
  ],

  users: [
    { role: "adviser",    title: "Adviser",    name: "Dr. Carl Domenic Reyes", initials: "DM", email: "carl.reyes@cmdi.edu.ph",    password: "adviser123",    studentId: null },
    { role: "instructor", title: "Instructor", name: "Prof. Jovic Lanao",      initials: "PJ", email: "jovic.lanao@cmdi.edu.ph",   password: "instructor123", studentId: null },
    { role: "student",    title: "Student",    name: "Alex Reyes",             initials: "AR", email: "alex.reyes@cmdi.edu.ph",    password: "student123",    studentId: "2023-10001" }
  ]
};

/* ---------- Storage helpers ---------- */
function ewLoadStore() {
  try {
    const raw = localStorage.getItem(EW_STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(EW_SEED));
    const parsed = JSON.parse(raw);
    // Merge missing top-level keys from seed
    for (const key of Object.keys(EW_SEED)) {
      if (!parsed[key]) parsed[key] = JSON.parse(JSON.stringify(EW_SEED[key]));
    }
    return parsed;
  } catch (err) {
    console.warn("[EW_DB] Failed to read localStorage, using seed.", err);
    return JSON.parse(JSON.stringify(EW_SEED));
  }
}

function ewSaveStore(store) {
  try {
    localStorage.setItem(EW_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("[EW_DB] Failed to write localStorage.", err);
  }
}

/* ---------- Public API ---------- */
const EW_DB = (function () {
  let store = ewLoadStore();
  const listeners = new Set();

  function persist() {
    ewSaveStore(store);
    emit();
  }

  function emit() {
    listeners.forEach(fn => { try { fn(store); } catch (e) { console.error(e); } });
  }

  return {
    ready: Promise.resolve(store),

    refresh() {
      store = ewLoadStore();
      emit();
      return Promise.resolve(store);
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    resetAll() {
      store = JSON.parse(JSON.stringify(EW_SEED));
      persist();
    },

    students: {
      all:   () => store.students.slice(),
      get:   id => store.students.find(s => s.id === id) || null,
      count: () => store.students.length
    },

    alerts: {
      all:    () => store.alerts.slice(),
      for:    id => store.alerts.filter(a => a.studentId === id),
      unread: () => store.alerts.filter(a => !a.acknowledged),

      async acknowledge(id) {
        const a = store.alerts.find(x => x.id === id);
        if (a) { a.acknowledged = true; persist(); }
      },
      async acknowledgeAll() {
        store.alerts.forEach(a => { a.acknowledged = true; });
        persist();
      },
      async add(data) {
        const item = {
          id: "a_" + Math.random().toString(36).slice(2, 9),
          studentId: data.studentId,
          severity: data.severity || "medium",
          kind: data.kind || "Note",
          message: data.message || "",
          date: data.date || new Date().toISOString().slice(0, 10),
          acknowledged: false
        };
        store.alerts.unshift(item);
        persist();
        return item;
      }
    },

    interventions: {
      all: () => store.interventions.slice(),
      for: id => store.interventions.filter(i => i.studentId === id),
      async add(data) {
        const item = {
          id: "i_" + Math.random().toString(36).slice(2, 9),
          studentId: data.studentId,
          type: data.type || "Counseling",
          status: data.status || "pending",
          assigned: data.assigned || "",
          action: data.action || "",
          date: data.date || new Date().toISOString().slice(0, 10),
          deadline: data.deadline || null
        };
        store.interventions.unshift(item);
        persist();
        return item;
      }
    },

    users: {
      all: function () { return store.users.slice(); },

      find: function (email) {
        return store.users.find(function (u) {
          return u.email.toLowerCase() === String(email).toLowerCase();
        }) || null;
      },

      add: function (user) {
        if (store.users.some(function (u) {
          return u.email.toLowerCase() === user.email.toLowerCase();
        })) {
          return { ok: false, errors: ["An account with that email already exists."] };
        }
        user.verified = false;
        store.users.push(user);
        persist();
        return { ok: true };
      },

      markVerified: function (email) {
        const u = store.users.find(function (x) {
          return x.email.toLowerCase() === String(email).toLowerCase();
        });
        if (!u) return { ok: false, errors: ["User not found."] };
        u.verified = true;
        persist();
        return { ok: true, user: u };
      }
    },

    /* ---------- Adviser Profile ---------- */
        /* ---------- Adviser Profile ---------- */
        /* ---------- Adviser Profile ---------- */
    adviserProfile: {
      STORAGE_KEY: "earlywatch.adviserProfile",

      /* Default profile derived from the session user + static defaults */
      defaults: function (user) {
        return {
          name:           (user && user.name)     || "Dr. Carl Domenic Reyes",
          initials:       (user && user.initials) || "DM",
          email:          (user && user.email)    || "carl.reyes@cmdi.edu.ph",
          title:          (user && user.title)    || "Adviser",
          department:     "College of Computer Studies",
          position:       "Academic Adviser",
          employeeId:     "EMP-2020-0142",
          phone:          "+63 917 555 0142",
          office:         "Room 305, CCS Building",
          officeHours:    "Mon–Fri · 8:00 AM – 5:00 PM",
          specialization: "Academic Advising, Student Retention",
          education:      "Ph.D. in Computer Science",
          joinedDate:     "2020-06-15",
          bio:            "Passionate about student success and early intervention. Dedicated to helping students overcome academic challenges through data-driven advising.",
          avatarImage:    null
        };
      },

      /* Get the stored profile, merged over defaults */
      get: function (user) {
        try {
          const raw = localStorage.getItem(this.STORAGE_KEY);
          const saved = raw ? JSON.parse(raw) : {};
          return Object.assign({}, this.defaults(user), saved);
        } catch (e) {
          console.warn("[EW_DB] Failed to read adviser profile:", e);
          return this.defaults(user);
        }
      },

      /* Save (partial or full) profile patch */
      save: function (patch) {
        try {
          const current = this.get();
          const merged = Object.assign({}, current, patch);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
          emit();
          return { ok: true, profile: merged };
        } catch (e) {
          console.warn("[EW_DB] Failed to save adviser profile:", e);
          return { ok: false, errors: ["Could not save profile."] };
        }
      },

      /* Save / update avatar image (base64 data URL) */
      saveAvatar: function (dataUrl) {
        return this.save({ avatarImage: dataUrl });
      },

      /* Remove avatar image (fall back to initials) */
      removeAvatar: function () {
        return this.save({ avatarImage: null });
      },

      /* Clear the stored profile */
      reset: function () {
        try {
          localStorage.removeItem(this.STORAGE_KEY);
          emit();
          return { ok: true };
        } catch (e) {
          return { ok: false, errors: ["Could not reset profile."] };
        }
      }
    },
    async addStudent(data) {
      if (store.students.some(s => s.id === data.id)) {
        return { ok: false, errors: ["A student with that ID already exists."] };
      }
      const student = {
        id: data.id,
        name: data.name,
        initials: initialsFrom(data.name),
        course: data.course || "",
        section: data.section || "",
        adviser: data.adviser || "",
        gpa: Number(data.gpa ?? 2.0),
        attendance: Number(data.attendance ?? 100),
        missed: Number(data.missed ?? 0),
        failedSubjects: Number(data.failedSubjects ?? 0),
        caseStatus: data.caseStatus || "Monitoring",
        subjects: data.subjects || [],
        history: data.history || [],
        notes: data.notes || []
      };
      store.students.push(student);
      persist();
      return { ok: true, student };
    },

    async updateStudent(id, patch) {
      const s = store.students.find(x => x.id === id);
      if (!s) return { ok: false, errors: ["Student not found."] };

      const fields = ["name","course","section","adviser","gpa","attendance","missed","failedSubjects","caseStatus"];
      for (const k of fields) {
        if (patch[k] !== undefined) s[k] = patch[k];
      }
      if (patch.name) s.initials = initialsFrom(patch.name);
      if (patch.gpa !== undefined) s.gpa = Number(patch.gpa);
      if (patch.attendance !== undefined) s.attendance = Number(patch.attendance);
      if (patch.missed !== undefined) s.missed = Number(patch.missed);
      if (patch.failedSubjects !== undefined) s.failedSubjects = Number(patch.failedSubjects);

      persist();
      return { ok: true, student: s };
    },

    async deleteStudent(id) {
      const before = store.students.length;
      store.students = store.students.filter(s => s.id !== id);
      store.alerts = store.alerts.filter(a => a.studentId !== id);
      store.interventions = store.interventions.filter(i => i.studentId !== id);
      persist();
      return { ok: store.students.length < before };
    }
  };
})();

function initialsFrom(name) {
  const parts = String(name).trim().split(/\s+/);
  let out = "";
  for (const p of parts.slice(0, 2)) if (p) out += p[0].toUpperCase();
  return out || "??";
}

const EW_STORE = {
  student:          id => EW_DB.students.get(id),
  alertsFor:        id => EW_DB.alerts.for(id),
  interventionsFor: id => EW_DB.interventions.for(id),
  unacknowledged:   () => EW_DB.alerts.unread()
};