import { useEffect, useMemo, useRef, useState } from "react";

const C = { panel: "rgba(255,255,255,.04)", border: "rgba(255,255,255,.1)", dim: "rgba(255,255,255,.5)", cyan: "#22d3ee" };

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Classic, print-ready A4 CV built from the profile. */
function buildCvHTML(p) {
  if (!p) return "";
  const contact = [p.email, p.phone, p.location, p.website].filter(Boolean).join("  ·  ");
  const exp = (p.experience || [])
    .map(
      (e) => `
    <div class="job">
      <div class="job-head"><span class="role">${esc(e.role)}</span><span class="period">${esc(e.period)}</span></div>
      <div class="company">${esc(e.company)}</div>
      <ul>${(e.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    </div>`,
    )
    .join("");
  const edu = (p.education || [])
    .map(
      (e) => `
    <div class="edu">
      <div class="job-head"><span class="role">${esc(e.degree)}</span><span class="period">${esc(e.period)}</span></div>
      <div class="company">${esc(e.school)}</div>
      ${e.detail ? `<div class="detail">${esc(e.detail)}</div>` : ""}
    </div>`,
    )
    .join("");
  const skills = Object.entries(p.skills || {})
    .map(([cat, list]) => `<div class="skillrow"><span class="skillcat">${esc(cat)}</span><span class="skilllist">${(list || []).map(esc).join(" · ")}</span></div>`)
    .join("");
  const games = (p.games || []).map((g) => `<li>${esc(g)}</li>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #ececec; font-size: 10.5pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { max-width: 210mm; margin: 18px auto; background: #fff; padding: 18mm 16mm; box-shadow: 0 2px 24px rgba(0,0,0,.18); }
    h1 { font-size: 25pt; letter-spacing: .5px; margin: 0 0 3px; }
    .title { font-style: italic; color: #444; font-size: 10.5pt; margin-bottom: 6px; }
    .contact { font-size: 9pt; color: #333; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
    h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 16px 0 10px; }
    .summary { margin: 0 0 4px; color: #333; }
    .job, .edu { margin-bottom: 12px; }
    .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .role { font-weight: 700; font-size: 11pt; }
    .period { color: #555; font-size: 9pt; white-space: nowrap; }
    .company { font-style: italic; color: #444; font-size: 9.5pt; margin-bottom: 3px; }
    .detail { color: #555; font-size: 9.5pt; }
    ul { margin: 3px 0 0; padding-left: 17px; }
    li { margin-bottom: 2px; }
    .skillrow { display: flex; gap: 12px; margin-bottom: 5px; }
    .skillcat { font-weight: 700; min-width: 90px; }
    .skilllist { color: #333; }
    .langs { margin: 0; }
  </style></head>
  <body><div class="sheet">
    <h1>${esc(p.name)}</h1>
    ${p.title ? `<div class="title">${esc(p.title)}</div>` : ""}
    <div class="contact">${esc(contact)}</div>
    ${p.summary ? `<h2>Profile</h2><p class="summary">${esc(p.summary)}</p>` : ""}
    ${exp ? `<h2>Experience</h2>${exp}` : ""}
    ${skills ? `<h2>Skills</h2>${skills}` : ""}
    ${games ? `<h2>Projects</h2><ul>${games}</ul>` : ""}
    ${edu ? `<h2>Education</h2>${edu}` : ""}
    ${(p.languages || []).length ? `<h2>Languages</h2><p class="langs">${(p.languages || []).map(esc).join("  ·  ")}</p>` : ""}
  </div></body></html>`;
}

export default function CvBuilder({ token, onSessionExpired, onToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polishing, setPolishing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const iframeRef = useRef(null);

  const load = () =>
    fetch("/api/profile", { headers: { authorization: `Bearer ${token}` } }).then((r) => {
      if (r.status === 401) { onSessionExpired?.(); return null; }
      return r.json();
    });

  useEffect(() => {
    load().then((d) => d && setProfile(d)).finally(() => setLoading(false));
  }, [token]);

  const html = useMemo(() => buildCvHTML(profile), [profile]);

  const printCv = () => {
    const w = iframeRef.current?.contentWindow;
    if (w) { w.focus(); w.print(); }
  };

  const improveSummary = async () => {
    if (!profile?.summary) return;
    setPolishing(true);
    setSuggestion("");
    try {
      const r = await fetch("/api/polish", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: profile.summary,
          instruction: "Rewrite this professional CV summary to be sharper, confident, and results-focused. Keep it 2-4 sentences and truthful — do not invent facts.",
        }),
      });
      if (r.status === 401) { onSessionExpired?.(); return; }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setSuggestion(d.text);
    } catch (e) {
      onToast?.(e.message || "AI polish failed");
    } finally {
      setPolishing(false);
    }
  };

  const applySuggestion = async () => {
    const updated = { ...profile, summary: suggestion };
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(updated),
    });
    if (r.status === 401) { onSessionExpired?.(); return; }
    const d = await r.json();
    if (r.ok) { setProfile(d); setSuggestion(""); onToast?.("Summary updated ✓"); }
    else onToast?.(d.error || "Save failed");
  };

  if (loading) return <div style={{ color: C.dim, padding: 40, textAlign: "center" }}>Loading CV…</div>;
  if (!profile) return null;

  const btn = {
    padding: "9px 18px", borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Outfit',sans-serif", border: "none",
  };

  return (
    <div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18 }}>
        <p style={{ color: C.dim, fontSize: 13, marginBottom: 14 }}>
          Your CV is generated live from your <b style={{ color: "#fff" }}>CV Profile</b> — edit the profile and it updates here. Export to PDF, or let AI sharpen your summary.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={printCv} style={{ ...btn, background: "linear-gradient(135deg,#22d3ee,#0891b2)", color: "#04121a" }}>⤓ Download / Print PDF</button>
          <button onClick={improveSummary} disabled={polishing} style={{ ...btn, background: "rgba(255,255,255,.06)", color: "#fff", border: `1px solid ${C.cyan}55`, opacity: polishing ? 0.6 : 1 }}>
            {polishing ? "Improving…" : "✨ Improve summary with AI"}
          </button>
        </div>
        {suggestion && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(34,211,238,.06)", border: "1px solid rgba(34,211,238,.25)" }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.cyan, fontWeight: 700, marginBottom: 8 }}>AI suggestion</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#fff", marginBottom: 12 }}>{suggestion}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={applySuggestion} style={{ ...btn, background: "linear-gradient(135deg,#22d3ee,#0891b2)", color: "#04121a" }}>Apply &amp; save</button>
              <button onClick={() => setSuggestion("")} style={{ ...btn, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.7)", border: `1px solid ${C.border}` }}>Discard</button>
            </div>
          </div>
        )}
      </div>
      <iframe ref={iframeRef} title="CV preview" srcDoc={html} style={{ width: "100%", height: 760, border: "none", borderRadius: 10, background: "#ececec" }} />
    </div>
  );
}
