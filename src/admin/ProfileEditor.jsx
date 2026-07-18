import { useEffect, useState } from "react";

const C = { panel: "rgba(255,255,255,.04)", border: "rgba(255,255,255,.1)", dim: "rgba(255,255,255,.5)", cyan: "#22d3ee" };
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,.03)",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  padding: "10px 13px",
  outline: "none",
  fontFamily: "'Outfit',sans-serif",
};
const labelStyle = {
  display: "block",
  fontSize: 11,
  letterSpacing: 1.3,
  textTransform: "uppercase",
  color: "rgba(255,255,255,.4)",
  fontWeight: 700,
  marginBottom: 6,
};

const lines = (v) => (Array.isArray(v) ? v.join("\n") : "");
const toLines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const btn = (variant) => ({
  primary: { background: "linear-gradient(135deg,#22d3ee,#0891b2)", color: "#04121a", border: "none" },
  ghost: { background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", border: `1px solid ${C.border}` },
  danger: { background: "rgba(248,113,113,.12)", color: "#f87171", border: "1px solid rgba(248,113,113,.35)" },
}[variant]);
const Button = ({ children, onClick, variant = "primary", disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      ...btn(variant),
      padding: "9px 18px",
      borderRadius: 99,
      fontSize: 13,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      fontFamily: "'Outfit',sans-serif",
    }}
  >
    {children}
  </button>
);

function Card({ children }) {
  return <div style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>{children}</div>;
}
function Section({ title, action, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ProfileEditor({ token, onSessionExpired, onToast }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) {
          onSessionExpired?.();
          return null;
        }
        return r.json();
      })
      .then((data) => data && setP(data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading profile…</div>;
  if (!p) return null;

  const set = (k) => (e) => setP((s) => ({ ...s, [k]: e.target.value }));

  // Skills: object -> editable rows
  const skillRows = Object.entries(p.skills || {});
  const setSkillCat = (i, name) => {
    const next = skillRows.map(([c, v], idx) => (idx === i ? [name, v] : [c, v]));
    setP((s) => ({ ...s, skills: Object.fromEntries(next) }));
  };
  const setSkillList = (i, csv) => {
    const list = csv.split(",").map((x) => x.trim()).filter(Boolean);
    const next = skillRows.map(([c, v], idx) => (idx === i ? [c, list] : [c, v]));
    setP((s) => ({ ...s, skills: Object.fromEntries(next) }));
  };
  const addSkillCat = () => setP((s) => ({ ...s, skills: { ...s.skills, [`Category ${Object.keys(s.skills || {}).length + 1}`]: [] } }));
  const removeSkillCat = (i) => setP((s) => ({ ...s, skills: Object.fromEntries(skillRows.filter((_, idx) => idx !== i)) }));

  // Experience
  const setExp = (i, field, val) => setP((s) => ({ ...s, experience: s.experience.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)) }));
  const addExp = () => setP((s) => ({ ...s, experience: [...(s.experience || []), { role: "", company: "", period: "", bullets: [] }] }));
  const removeExp = (i) => setP((s) => ({ ...s, experience: s.experience.filter((_, idx) => idx !== i) }));

  // Education
  const setEdu = (i, field, val) => setP((s) => ({ ...s, education: s.education.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)) }));
  const addEdu = () => setP((s) => ({ ...s, education: [...(s.education || []), { degree: "", school: "", period: "", detail: "" }] }));
  const removeEdu = (i) => setP((s) => ({ ...s, education: s.education.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(p),
      });
      if (r.status === 401) {
        onSessionExpired?.();
        return;
      }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed");
      setP(data);
      onToast?.("Profile saved ✓ — the AI generator now uses it");
    } catch (e) {
      onToast?.(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const two = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
      <p style={{ color: C.dim, fontSize: 13, marginBottom: 22 }}>
        This is the CV the <b style={{ color: "#fff" }}>Application AI</b> draws from. Keep it current — it never invents facts beyond what's here.
      </p>

      <Section title="Basics">
        <div style={two}>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={p.name || ""} onChange={set("name")} /></div>
          <div><label style={labelStyle}>Headline / title</label><input style={inputStyle} value={p.title || ""} onChange={set("title")} /></div>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} value={p.email || ""} onChange={set("email")} /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={p.phone || ""} onChange={set("phone")} /></div>
          <div><label style={labelStyle}>Location</label><input style={inputStyle} value={p.location || ""} onChange={set("location")} /></div>
          <div><label style={labelStyle}>Website</label><input style={inputStyle} value={p.website || ""} onChange={set("website")} /></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Professional summary</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={p.summary || ""} onChange={set("summary")} />
        </div>
      </Section>

      <Section title="Experience" action={<Button variant="ghost" onClick={addExp}>＋ Add</Button>}>
        {(p.experience || []).map((e, i) => (
          <Card key={i}>
            <div style={two}>
              <div><label style={labelStyle}>Role</label><input style={inputStyle} value={e.role} onChange={(ev) => setExp(i, "role", ev.target.value)} /></div>
              <div><label style={labelStyle}>Company</label><input style={inputStyle} value={e.company} onChange={(ev) => setExp(i, "company", ev.target.value)} /></div>
            </div>
            <div style={{ marginTop: 10 }}><label style={labelStyle}>Period</label><input style={inputStyle} value={e.period} onChange={(ev) => setExp(i, "period", ev.target.value)} placeholder="2023 – Present" /></div>
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>Bullets (one per line)</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={lines(e.bullets)} onChange={(ev) => setExp(i, "bullets", toLines(ev.target.value))} />
            </div>
            <div style={{ marginTop: 10, textAlign: "right" }}><Button variant="danger" onClick={() => removeExp(i)}>Remove</Button></div>
          </Card>
        ))}
      </Section>

      <Section title="Skills" action={<Button variant="ghost" onClick={addSkillCat}>＋ Category</Button>}>
        {skillRows.map(([cat, list], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input style={inputStyle} value={cat} onChange={(ev) => setSkillCat(i, ev.target.value)} />
            <input style={inputStyle} value={(list || []).join(", ")} onChange={(ev) => setSkillList(i, ev.target.value)} placeholder="comma, separated, skills" />
            <Button variant="danger" onClick={() => removeSkillCat(i)}>✕</Button>
          </div>
        ))}
      </Section>

      <Section title="Education" action={<Button variant="ghost" onClick={addEdu}>＋ Add</Button>}>
        {(p.education || []).map((e, i) => (
          <Card key={i}>
            <div style={two}>
              <div><label style={labelStyle}>Degree</label><input style={inputStyle} value={e.degree} onChange={(ev) => setEdu(i, "degree", ev.target.value)} /></div>
              <div><label style={labelStyle}>School</label><input style={inputStyle} value={e.school} onChange={(ev) => setEdu(i, "school", ev.target.value)} /></div>
            </div>
            <div style={{ ...two, marginTop: 10 }}>
              <div><label style={labelStyle}>Period</label><input style={inputStyle} value={e.period} onChange={(ev) => setEdu(i, "period", ev.target.value)} /></div>
              <div><label style={labelStyle}>Detail (optional)</label><input style={inputStyle} value={e.detail || ""} onChange={(ev) => setEdu(i, "detail", ev.target.value)} /></div>
            </div>
            <div style={{ marginTop: 10, textAlign: "right" }}><Button variant="danger" onClick={() => removeEdu(i)}>Remove</Button></div>
          </Card>
        ))}
      </Section>

      <Section title="Games & projects (one per line)">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={lines(p.games)} onChange={(e) => setP((s) => ({ ...s, games: toLines(e.target.value) }))} />
      </Section>

      <Section title="Languages (one per line)">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={lines(p.languages)} onChange={(e) => setP((s) => ({ ...s, languages: toLines(e.target.value) }))} />
      </Section>

      <div style={{ position: "sticky", bottom: 0, paddingTop: 8 }}>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
      </div>
    </div>
  );
}
