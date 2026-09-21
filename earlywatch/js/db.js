/* ============================================================
   EarlyWatch — PHP/MySQL-backed Data Layer (XAMPP)
   Same synchronous read API (EW_DB.students.all(), etc.)
   Writes hit api/*.php; cache refreshes after every write.
   ============================================================ */

const EW_API = "api";

const EW_DB = (function () {
  let cache = { students: [], alerts: [], interventions: [] };

  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(cache); } catch (e) { console.error(e); } });

  async function refresh() {
    const [list, alerts, interventions] = await Promise.all([
      fetch(`${EW_API}/students.php`).then(r => r.json()),
      fetch(`${EW_API}/alerts.php`).then(r => r.json()),
      fetch(`${EW_API}/interventions.php`).then(r => r.json())
    ]);

    /* Enrich each student with subjects/history/notes */
    const detailed = await Promise.all(
      list.map(s =>
        fetch(`${EW_API}/student.php?id=${encodeURIComponent(s.id)}`).then(r => r.json())
      )
    );

    cache = { students: detailed, alerts, interventions };
    emit();
    return cache;
  }

  const ready = refresh().catch(err => {
    console.error("[EW_DB] Initial load failed:", err);
    return cache;
  });

  return {
    ready,
    refresh,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    students: {
      all:   () => cache.students.slice(),
      get:   id => cache.students.find(s => s.id === id) || null,
      count: () => cache.students.length
    },

    alerts: {
      all:    () => cache.alerts.slice(),
      for:    id => cache.alerts.filter(a => a.studentId === id),
      unread: () => cache.alerts.filter(a => !a.acknowledged),

      async acknowledge(id) {
        await fetch(`${EW_API}/alerts-ack.php?id=${encodeURIComponent(id)}`, { method: "POST" });
        await refresh();
      },
      async acknowledgeAll() {
        await fetch(`${EW_API}/alerts-ack-all.php`, { method: "POST" });
        await refresh();
      },
      async add(data) {
        const res = await fetch(`${EW_API}/alerts-create.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        await refresh();
        return res.json();
      }
    },

    interventions: {
      all: () => cache.interventions.slice(),
      for: id => cache.interventions.filter(i => i.studentId === id),
      async add(data) {
        const res = await fetch(`${EW_API}/interventions.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        await refresh();
        return res.json();
      }
    },

    async addStudent(data) {
      const res = await fetch(`${EW_API}/students.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) return { ok: false, errors: body.errors || ["Request failed."] };
      await refresh();
      return { ok: true, student: body };
    },

    async updateStudent(id, patch) {
      const res = await fetch(`${EW_API}/student.php?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const body = await res.json();
      if (!res.ok) return { ok: false, errors: body.errors || ["Request failed."] };
      await refresh();
      return { ok: true, student: body };
    },

    async deleteStudent(id) {
      const res = await fetch(`${EW_API}/student.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, errors: body.errors || ["Delete failed."] };
      }
      await refresh();
      return { ok: true };
    }
  };
})();

const EW_STORE = {
  student:          id => EW_DB.students.get(id),
  alertsFor:        id => EW_DB.alerts.for(id),
  interventionsFor: id => EW_DB.interventions.for(id),
  unacknowledged:   () => EW_DB.alerts.unread()
};