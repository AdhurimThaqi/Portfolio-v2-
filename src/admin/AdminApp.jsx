import { useEffect, useState } from "react";
import ApplicationAI from "./ApplicationAI.jsx";
import ProfileEditor from "./ProfileEditor.jsx";

/* ════════════════════════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════════════════════════ */
const TOKEN_KEY = "pf_admin_token";

const COLOR_PRESETS = [
  "#22d3ee", "#a78bfa", "#34d399", "#fb923c",
  "#f472b6", "#facc15", "#60a5fa", "#f87171",
];

const EMOJI_PRESETS = ["🎮", "🌐", "🎨", "📱", "⚙️", "🧠", "🕶️", "✦"];

const EMPTY = {
  id: "",
  title: "",
  tech: "",
  category: "",
  year: String(new Date().getFullYear()),
  color: "#22d3ee",
  emoji: "",
  desc: "",
  challenge: "",
  github: "",
  liveUrl: "",
  stack: [],
  features: [],
  images: [],
};

/* ════════════════════════════════════════════════════════════════
   API
════════════════════════════════════════════════════════════════ */
async function apiLogin(password) {
  const r = await fetch("/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Login failed");
  return data.token;
}

async function apiGetProjects() {
  const r = await fetch("/api/projects");
  if (!r.ok) return [];
  return r.json();
}

async function apiSaveProject(token, project) {
  const r = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error("SESSION_EXPIRED");
  if (!r.ok) throw new Error(data.error || "Save failed");
  return data;
}

async function apiDeleteProject(token, id) {
  const r = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (r.status === 401) throw new Error("SESSION_EXPIRED");
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || "Delete failed");
  }
  return true;
}

/* ── Client-side image compression -> data URL ────────────────── */
function compressImage(file, maxDim = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════════════════════════
   STYLE PRIMITIVES
════════════════════════════════════════════════════════════════ */
const C = {
  bg: "#05050a",
  panel: "rgba(255,255,255,.04)",
  border: "rgba(255,255,255,.1)",
  text: "#fff",
  dim: "rgba(255,255,255,.5)",
  cyan: "#22d3ee",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,.03)",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  padding: "11px 14px",
  outline: "none",
  fontFamily: "'Outfit',sans-serif",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "rgba(255,255,255,.4)",
  fontWeight: 700,
  marginBottom: 7,
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && (
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.3)", marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", disabled }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg,#22d3ee,#0891b2)",
      color: "#04121a",
      border: "none",
    },
    ghost: {
      background: "rgba(255,255,255,.05)",
      color: "rgba(255,255,255,.7)",
      border: `1px solid ${C.border}`,
    },
    danger: {
      background: "rgba(248,113,113,.12)",
      color: "#f87171",
      border: "1px solid rgba(248,113,113,.35)",
    },
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles,
        padding: "10px 20px",
        borderRadius: 99,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontFamily: "'Outfit',sans-serif",
        transition: "transform .15s, box-shadow .2s",
      }}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════════════════════════ */
function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const token = await apiLogin(password);
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 400,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 34,
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            <span style={{ color: C.cyan }}>A</span>DHURIM · Admin
          </div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 6 }}>
            Sign in to manage your portfolio
          </div>
        </div>

        <Field label="Password">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <div
            style={{
              color: "#f87171",
              fontSize: 13,
              marginBottom: 14,
              background: "rgba(248,113,113,.1)",
              border: "1px solid rgba(248,113,113,.25)",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 6 }}>
          <Button type="submit" disabled={busy || !password}>
            {busy ? "Signing in…" : "Sign in →"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROJECT FORM
════════════════════════════════════════════════════════════════ */
function ProjectForm({ initial, onSave, onCancel, busy }) {
  const [p, setP] = useState({ ...EMPTY, ...initial });
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState("");

  const set = (k) => (e) => setP((s) => ({ ...s, [k]: e.target.value }));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setImgError("");
    try {
      const dataUrls = [];
      for (const f of files) dataUrls.push(await compressImage(f));
      setP((s) => ({ ...s, images: [...s.images, ...dataUrls].slice(0, 6) }));
    } catch (err) {
      setImgError(err.message || "Image failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (i) =>
    setP((s) => ({ ...s, images: s.images.filter((_, idx) => idx !== i) }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...p,
      stack:
        typeof p.stack === "string"
          ? p.stack.split(",").map((x) => x.trim()).filter(Boolean)
          : p.stack,
      features:
        typeof p.features === "string"
          ? p.features.split("\n").map((x) => x.trim()).filter(Boolean)
          : p.features,
    });
  };

  const stackValue = Array.isArray(p.stack) ? p.stack.join(", ") : p.stack;
  const featuresValue = Array.isArray(p.features) ? p.features.join("\n") : p.features;

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Title">
          <input required style={inputStyle} value={p.title} onChange={set("title")} placeholder="CoinQuest" />
        </Field>
        <Field label="Tech line" hint="Shown under the title">
          <input style={inputStyle} value={p.tech} onChange={set("tech")} placeholder="Unity · C#" />
        </Field>
        <Field label="Category / badge">
          <input style={inputStyle} value={p.category} onChange={set("category")} placeholder="3D Adventure · Web App · Design" />
        </Field>
        <Field label="Year">
          <input style={inputStyle} value={p.year} onChange={set("year")} placeholder="2025" />
        </Field>
      </div>

      <Field label="Short description" hint="1–2 sentences shown on the card and modal">
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          value={p.desc}
          onChange={set("desc")}
          placeholder="A 3D adventure game with enemy AI and procedural levels…"
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="GitHub URL">
          <input style={inputStyle} value={p.github} onChange={set("github")} placeholder="https://github.com/…" />
        </Field>
        <Field label="Live URL (optional)">
          <input style={inputStyle} value={p.liveUrl} onChange={set("liveUrl")} placeholder="https://…" />
        </Field>
      </div>

      <Field label="Tech stack" hint="Comma-separated, e.g. Unity 6, C#, Physics Engine">
        <input style={inputStyle} value={stackValue} onChange={set("stack")} placeholder="React, Node.js, MongoDB" />
      </Field>

      <Field label="Key features" hint="One per line">
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          value={featuresValue}
          onChange={set("features")}
          placeholder={"Procedural level generation\nEnemy AI with pathfinding\nDynamic HUD"}
        />
      </Field>

      <Field label="Challenge & solution (optional)">
        <textarea
          style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
          value={p.challenge}
          onChange={set("challenge")}
          placeholder="Balancing difficulty without frustrating the player — solved with adaptive AI…"
        />
      </Field>

      {/* Accent colour */}
      <Field label="Accent colour">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {COLOR_PRESETS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setP((s) => ({ ...s, color: c }))}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: c,
                border: p.color === c ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
          <input
            type="color"
            value={p.color}
            onChange={set("color")}
            style={{ width: 40, height: 32, background: "none", border: "none", cursor: "pointer" }}
          />
        </div>
      </Field>

      {/* Emoji */}
      <Field label="Card icon" hint="Optional emoji shown on the card corner">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMOJI_PRESETS.map((em) => (
            <button
              type="button"
              key={em}
              onClick={() => setP((s) => ({ ...s, emoji: s.emoji === em ? "" : em }))}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                fontSize: 18,
                background: p.emoji === em ? p.color + "22" : "rgba(255,255,255,.04)",
                border: `1px solid ${p.emoji === em ? p.color : C.border}`,
                cursor: "pointer",
              }}
            >
              {em}
            </button>
          ))}
        </div>
      </Field>

      {/* Images */}
      <Field label="Images" hint="First image is the cover. Auto-compressed. Up to 6.">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          {p.images.map((src, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={src}
                alt=""
                style={{
                  width: 120,
                  height: 74,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: i === 0 ? `2px solid ${C.cyan}` : `1px solid ${C.border}`,
                }}
              />
              {i === 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    background: C.cyan,
                    color: "#04121a",
                    borderRadius: 5,
                    padding: "1px 6px",
                  }}
                >
                  COVER
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#f87171",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label
          style={{
            ...inputStyle,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "auto",
            cursor: "pointer",
            color: C.cyan,
          }}
        >
          {uploading ? "Compressing…" : "＋ Add image(s)"}
          <input type="file" accept="image/*" multiple hidden onChange={handleFiles} />
        </label>
        {imgError && (
          <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{imgError}</div>
        )}
      </Field>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save changes" : "Create project"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROJECT ROW
════════════════════════════════════════════════════════════════ */
function ProjectRow({ project, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 14,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 84,
          height: 54,
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
          background: "#000",
          border: `1px solid ${project.color}44`,
        }}
      >
        {project.images?.[0] ? (
          <img src={project.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            {project.emoji || "✦"}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{project.title}</div>
        <div style={{ color: project.color, fontSize: 12, fontWeight: 600 }}>
          {project.tech} {project.year ? `· ${project.year}` : ""}
        </div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>{project.category}</div>
      </div>
      <Button variant="ghost" onClick={() => onEdit(project)}>
        Edit
      </Button>
      <Button variant="danger" onClick={() => onDelete(project)}>
        Delete
      </Button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════════ */
export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | project
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("projects"); // "projects" | "applications"

  // Inject fonts + reset once
  useEffect(() => {
    document.title = "Portfolio Admin · Adhurim Thaqi";
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${C.bg};color:#fff;font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased}
      ::-webkit-scrollbar{width:8px}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:99px}
      textarea,input{font-family:'Outfit',sans-serif}
    `;
    document.head.appendChild(style);
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const load = async () => {
    setLoading(true);
    setProjects(await apiGetProjects());
    setLoading(false);
  };

  useEffect(() => {
    if (token) load();
    else setLoading(false);
  }, [token]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProjects([]);
  };

  const handleAuthError = (err) => {
    if (err.message === "SESSION_EXPIRED") {
      flash("Session expired — please sign in again");
      logout();
      return true;
    }
    return false;
  };

  const save = async (project) => {
    setBusy(true);
    try {
      await apiSaveProject(token, project);
      flash(project.id ? "Project updated ✓" : "Project created ✓");
      setEditing(null);
      await load();
    } catch (err) {
      if (!handleAuthError(err)) flash(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (project) => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await apiDeleteProject(token, project.id);
      flash("Project deleted");
      await load();
    } catch (err) {
      if (!handleAuthError(err)) flash(err.message || "Delete failed");
    }
  };

  if (!token) return <Login onLogin={setToken} />;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 80px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 26,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22 }}>
            <span style={{ color: C.cyan }}>A</span>DHURIM · Admin
          </div>
          <div style={{ color: C.dim, fontSize: 13 }}>Manage your portfolio projects</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <Button variant="ghost">View site ↗</Button>
          </a>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, borderBottom: `1px solid ${C.border}` }}>
        {[
          ["projects", "Projects"],
          ["applications", "Application AI"],
          ["profile", "My CV Profile"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === id ? C.cyan : "transparent"}`,
              color: tab === id ? "#fff" : C.dim,
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 14px",
              cursor: "pointer",
              fontFamily: "'Outfit',sans-serif",
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "applications" ? (
        <ApplicationAI
          token={token}
          onSessionExpired={() => {
            flash("Session expired — please sign in again");
            logout();
          }}
        />
      ) : tab === "profile" ? (
        <ProfileEditor
          token={token}
          onToast={flash}
          onSessionExpired={() => {
            flash("Session expired — please sign in again");
            logout();
          }}
        />
      ) : editing !== null ? (
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: 26,
          }}
        >
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, marginBottom: 20 }}>
            {editing.id ? "Edit project" : "New project"}
          </h2>
          <ProjectForm
            initial={editing}
            busy={busy}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: C.dim, fontSize: 13 }}>
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </div>
            <Button onClick={() => setEditing({ ...EMPTY })}>＋ Add project</Button>
          </div>

          {loading ? (
            <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading…</div>
          ) : projects.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${C.border}`,
                borderRadius: 16,
                padding: 50,
                textAlign: "center",
                color: C.dim,
              }}
            >
              No projects yet. Click <b style={{ color: "#fff" }}>Add project</b> to create your first one — it appears on your live site instantly.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projects.map((p) => (
                <ProjectRow key={p.id} project={p} onEdit={setEditing} onDelete={remove} />
              ))}
            </div>
          )}
        </>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(8,8,18,.96)",
            border: `1px solid ${C.cyan}55`,
            color: "#fff",
            padding: "12px 22px",
            borderRadius: 99,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: `0 8px 40px ${C.cyan}22`,
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
