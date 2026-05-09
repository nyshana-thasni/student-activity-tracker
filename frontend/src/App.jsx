import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const api = {
  async get(path) {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },
  async del(path) {
    const res = await fetch(`${API}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SummaryCard({ summary, loading }) {
  if (loading) return <div className="summary-card loading">Loading summary…</div>;
  if (!summary) return null;
  return (
    <div className="summary-card">
      <h2 className="section-title">📊 Summary</h2>
      <div className="summary-grid">
        <div className="stat">
          <span className="stat-value">{summary.total_entries}</span>
          <span className="stat-label">Total Entries</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.total_hours}</span>
          <span className="stat-label">Total Hours</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.most_active_user ?? "—"}</span>
          <span className="stat-label">Most Active</span>
        </div>
      </div>
    </div>
  );
}

function ActivityForm({ onAdd }) {
  const [form, setForm]         = useState({ name: "", activity: "", hours: "" });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.activity.trim()) e.activity = "Activity is required";
    if (!form.hours)           e.hours    = "Hours is required";
    else if (isNaN(form.hours) || Number(form.hours) <= 0)
                               e.hours    = "Hours must be a positive number";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const newEntry = await api.post("/activities", {
        name:     form.name.trim(),
        activity: form.activity.trim(),
        hours:    Number(form.hours),
      });
      onAdd(newEntry);
      setForm({ name: "", activity: "", hours: "" });
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      if (err.details) setErrors(err.details);
      else setErrors({ _general: err.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <h2 className="section-title">➕ Add Activity</h2>
      {errors._general && <p className="error-banner">{errors._general}</p>}
      {success         && <p className="success-banner">✅ Activity added!</p>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label>Student Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Arjun Nair"
              className={errors.name ? "invalid" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Activity</label>
            <input
              name="activity"
              value={form.activity}
              onChange={handleChange}
              placeholder="e.g. Coding, Reading"
              className={errors.activity ? "invalid" : ""}
            />
            {errors.activity && <span className="field-error">{errors.activity}</span>}
          </div>
          <div className="field field-sm">
            <label>Hours</label>
            <input
              name="hours"
              type="number"
              min="0.1"
              step="0.5"
              value={form.hours}
              onChange={handleChange}
              placeholder="e.g. 2.5"
              className={errors.hours ? "invalid" : ""}
            />
            {errors.hours && <span className="field-error">{errors.hours}</span>}
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Adding…" : "Add Activity"}
        </button>
      </form>
    </div>
  );
}

function ActivityTable({ activities, onDelete, loading }) {
  if (loading) return <div className="card loading-text">Loading activities…</div>;

  return (
    <div className="card">
      <h2 className="section-title">📋 Activities ({activities.length})</h2>
      {activities.length === 0 ? (
        <p className="empty">No activities yet. Add one above!</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Activity</th>
                <th>Hours</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.activity}</td>
                  <td>{a.hours}h</td>
                  <td>{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(a.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activities, setActivities] = useState([]);
  const [summary, setSummary]       = useState(null);
  const [actLoading, setActLoading] = useState(true);
  const [sumLoading, setSumLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchAll = useCallback(async () => {
    setFetchError("");
    try {
      const [acts, sum] = await Promise.all([
        api.get("/activities"),
        api.get("/summary"),
      ]);
      setActivities(acts);
      setSummary(sum);
    } catch (err) {
      setFetchError("⚠️ Could not connect to backend. Make sure Flask is running on port 5000.");
    } finally {
      setActLoading(false);
      setSumLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Optimistic add — prepend then re-fetch summary
  const handleAdd = async (newEntry) => {
    setActivities((prev) => [newEntry, ...prev]);
    try {
      const sum = await api.get("/summary");
      setSummary(sum);
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      await api.del(`/activities/${id}`);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      const sum = await api.get("/summary");
      setSummary(sum);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <span className="logo">🎓</span>
            <div>
              <h1>Student Activity Tracker</h1>
              <p className="tagline">Track, summarize, and review student activities</p>
            </div>
          </div>
        </header>

        <main className="main">
          {fetchError && <div className="error-banner global">{fetchError}</div>}

          <SummaryCard summary={summary} loading={sumLoading} />
          <ActivityForm onAdd={handleAdd} />
          <ActivityTable
            activities={activities}
            onDelete={handleDelete}
            loading={actLoading}
          />
        </main>

        <footer className="footer">
          Built with React + Flask · Student Activity Tracker
        </footer>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f0f4ff;
    --surface:  #ffffff;
    --primary:  #3b5bdb;
    --primary-h:#2f4ac0;
    --accent:   #f76707;
    --danger:   #e03131;
    --text:     #1a1d2e;
    --muted:    #6c737a;
    --border:   #dde3f0;
    --radius:   12px;
    --shadow:   0 2px 12px rgba(59,91,219,.10);
  }

  body {
    font-family: 'Sora', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  /* Header */
  .header {
    background: var(--primary);
    color: #fff;
    padding: 24px 0;
    box-shadow: 0 4px 20px rgba(59,91,219,.3);
  }
  .header-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo { font-size: 2.2rem; }
  .header h1 { font-size: 1.6rem; font-weight: 700; }
  .tagline { font-size: .85rem; opacity: .8; margin-top: 2px; }

  /* Main */
  .main {
    max-width: 900px;
    margin: 32px auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Cards */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 28px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
  }
  .section-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--text);
  }

  /* Summary */
  .summary-card {
    background: var(--primary);
    border-radius: var(--radius);
    padding: 28px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(59,91,219,.25);
  }
  .summary-card .section-title { color: #fff; opacity: .9; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .stat {
    background: rgba(255,255,255,.12);
    border-radius: 10px;
    padding: 20px 16px;
    text-align: center;
  }
  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .stat-label { font-size: .78rem; opacity: .8; margin-top: 4px; display: block; }

  /* Form */
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 16px;
    align-items: start;
    margin-bottom: 20px;
  }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: .82rem; font-weight: 600; color: var(--muted); }
  .field input {
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Sora', sans-serif;
    font-size: .9rem;
    color: var(--text);
    outline: none;
    transition: border-color .2s;
    background: #f8faff;
  }
  .field input:focus { border-color: var(--primary); background: #fff; }
  .field input.invalid { border-color: var(--danger); background: #fff5f5; }
  .field-error { font-size: .75rem; color: var(--danger); margin-top: 2px; }
  .field-sm { min-width: 110px; }

  /* Buttons */
  .btn-primary {
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 28px;
    font-family: 'Sora', sans-serif;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s, transform .1s;
  }
  .btn-primary:hover:not(:disabled) { background: var(--primary-h); }
  .btn-primary:active:not(:disabled) { transform: scale(.98); }
  .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

  .btn-delete {
    background: none;
    border: 1px solid #ffd0d0;
    color: var(--danger);
    border-radius: 6px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: .9rem;
    transition: background .15s;
  }
  .btn-delete:hover { background: #fff0f0; }

  /* Table */
  .table-wrapper { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .88rem; }
  th {
    text-align: left;
    padding: 10px 14px;
    background: var(--bg);
    color: var(--muted);
    font-size: .75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .05em;
    border-bottom: 1.5px solid var(--border);
  }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8faff; }

  /* Banners */
  .error-banner {
    background: #fff0f0;
    color: var(--danger);
    border: 1px solid #ffc0c0;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: .87rem;
    margin-bottom: 12px;
  }
  .error-banner.global { margin-bottom: 0; }
  .success-banner {
    background: #f0fff4;
    color: #276749;
    border: 1px solid #9ae6b4;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: .87rem;
    margin-bottom: 12px;
  }

  .empty { color: var(--muted); font-size: .9rem; text-align: center; padding: 32px 0; }
  .loading, .loading-text { color: var(--muted); padding: 20px; text-align: center; font-size: .9rem; }

  /* Footer */
  .footer {
    text-align: center;
    padding: 32px 20px;
    color: var(--muted);
    font-size: .8rem;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
    .summary-grid { grid-template-columns: 1fr 1fr; }
    .header h1 { font-size: 1.3rem; }
  }
`;
