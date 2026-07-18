import { useMemo, useRef, useState } from "react";

const C = {
  panel: "rgba(255,255,255,.04)",
  border: "rgba(255,255,255,.1)",
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

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* ── Classic, print-ready A4 document (cover letter + resume) ──── */
function buildDocHTML(result, profile, want) {
  const p = profile || {};
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const contact = [p.email, p.phone, p.location, p.website].filter(Boolean).join("  ·  ");

  const header = `
    <header class="doc-head">
      <h1>${esc(p.name)}</h1>
      ${p.title ? `<div class="doc-title">${esc(p.title)}</div>` : ""}
      <div class="doc-contact">${esc(contact)}</div>
    </header>`;

  let letter = "";
  const cl = result?.coverLetter;
  if (want.letter && cl) {
    letter = `
    <section class="letter">
      <div class="date">${esc(today)}</div>
      <p class="greeting">${esc(cl.greeting || "Dear Hiring Team,")}</p>
      ${(cl.paragraphs || []).map((para) => `<p>${esc(para)}</p>`).join("")}
      <p class="closing">${esc(cl.closing || "Kind regards,")}</p>
      <p class="signature">${esc(cl.signature || p.name)}</p>
    </section>`;
  }

  let resume = "";
  const r = result?.resume;
  if (want.resume && r) {
    const exp = (r.experience || [])
      .map(
        (e) => `
      <div class="job">
        <div class="job-head">
          <span class="job-role">${esc(e.role)}</span>
          <span class="job-period">${esc(e.period)}</span>
        </div>
        <div class="job-company">${esc(e.company)}</div>
        <ul>${(e.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`,
      )
      .join("");
    const edu = (r.education || [])
      .map(
        (e) => `
      <div class="edu">
        <div class="job-head">
          <span class="job-role">${esc(e.degree)}</span>
          <span class="job-period">${esc(e.period)}</span>
        </div>
        <div class="job-company">${esc(e.school)}</div>
      </div>`,
      )
      .join("");

    resume = `
    <section class="resume">
      ${r.headline ? `<div class="r-headline">${esc(r.headline)}</div>` : ""}
      ${r.summary ? `<p class="r-summary">${esc(r.summary)}</p>` : ""}
      ${
        (r.highlights || []).length
          ? `<h2>Highlights</h2><ul class="highlights">${r.highlights
              .map((h) => `<li>${esc(h)}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${(r.skills || []).length ? `<h2>Skills</h2><div class="skills">${r.skills.map((s) => `<span>${esc(s)}</span>`).join("")}</div>` : ""}
      ${exp ? `<h2>Experience</h2>${exp}` : ""}
      ${edu ? `<h2>Education</h2>${edu}` : ""}
      ${(r.languages || []).length ? `<h2>Languages</h2><p class="langs">${r.languages.map(esc).join("  ·  ")}</p>` : ""}
    </section>`;
  }

  const pageBreak = letter && resume ? `<div class="page-break"></div>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a; background: #fff;
      font-size: 11pt; line-height: 1.55;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .sheet { padding: 22mm 20mm; max-width: 210mm; margin: 0 auto; }
    .doc-head { border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 26px; }
    .doc-head h1 { font-size: 26pt; letter-spacing: 1px; margin: 0 0 4px; font-weight: 700; }
    .doc-title { font-size: 10.5pt; font-style: italic; color: #444; margin-bottom: 8px; }
    .doc-contact { font-size: 9.5pt; color: #333; letter-spacing: .3px; }
    .letter .date { color: #444; margin-bottom: 22px; font-size: 10pt; }
    .letter .greeting { margin: 0 0 14px; }
    .letter p { margin: 0 0 13px; text-align: justify; }
    .letter .closing { margin-top: 22px; margin-bottom: 2px; }
    .letter .signature { font-weight: 700; margin: 0; }
    .page-break { page-break-before: always; height: 0; }
    .resume { margin-top: 4px; }
    .r-headline { font-size: 12pt; font-weight: 700; color: #222; margin-bottom: 6px; }
    .r-summary { margin: 0 0 18px; color: #333; }
    .resume h2 {
      font-size: 10pt; text-transform: uppercase; letter-spacing: 2px;
      color: #1a1a1a; border-bottom: 1px solid #ccc;
      padding-bottom: 4px; margin: 20px 0 12px; font-weight: 700;
    }
    .highlights { margin: 0 0 4px; padding-left: 18px; }
    .highlights li { margin-bottom: 5px; }
    .skills { display: flex; flex-wrap: wrap; gap: 6px 8px; }
    .skills span {
      border: 1px solid #bbb; border-radius: 3px;
      padding: 2px 9px; font-size: 9pt; font-family: Georgia, serif;
    }
    .job, .edu { margin-bottom: 14px; }
    .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .job-role { font-weight: 700; font-size: 11pt; }
    .job-period { color: #555; font-size: 9.5pt; white-space: nowrap; }
    .job-company { font-style: italic; color: #444; font-size: 10pt; margin-bottom: 4px; }
    .job ul { margin: 4px 0 0; padding-left: 18px; }
    .job li { margin-bottom: 3px; }
    .langs { margin: 0; }
    @media screen { body { background: #ececec; } .sheet { background: #fff; margin: 0 auto; box-shadow: 0 2px 24px rgba(0,0,0,.18); } }
  </style></head>
  <body><div class="sheet">${header}${letter}${pageBreak}${resume}</div></body></html>`;
}

const TONES = ["professional and warm", "confident and direct", "enthusiastic", "formal and classic"];

export default function ApplicationAI({ token, onSessionExpired }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState("en");
  const [wantLetter, setWantLetter] = useState(true);
  const [wantResume, setWantResume] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [profile, setProfile] = useState(null);
  const iframeRef = useRef(null);

  const want = { letter: wantLetter, resume: wantResume };
  const docHTML = useMemo(
    () => (result ? buildDocHTML(result, profile, want) : ""),
    [result, profile, wantLetter, wantResume],
  );

  const generate = async () => {
    if (!wantLetter && !wantResume) {
      setError("Pick at least one output.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ company, role, jobDescription, tone, language, outputs: want }),
      });
      if (r.status === 401) {
        onSessionExpired?.();
        return;
      }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Generation failed");
      setResult(data.result);
      setProfile(data.profile);
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const printDoc = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
  };

  return (
    <div>
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Company</label>
            <input style={inputStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google Zürich" />
          </div>
          <div>
            <label style={labelStyle}>Role / position</label>
            <input style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Job description / posting</label>
          <textarea
            style={{ ...inputStyle, minHeight: 150, resize: "vertical" }}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here — the AI tailors the letter and resume to it."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Tone</label>
            <select style={inputStyle} value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t} style={{ background: "#0b0b14" }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Language</label>
            <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en" style={{ background: "#0b0b14" }}>English</option>
              <option value="de" style={{ background: "#0b0b14" }}>German (Deutsch)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={wantLetter} onChange={(e) => setWantLetter(e.target.checked)} />
            Cover letter
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={wantResume} onChange={(e) => setWantResume(e.target.checked)} />
            Tailored resume
          </label>
          <button
            onClick={generate}
            disabled={busy}
            style={{
              marginLeft: "auto",
              background: "linear-gradient(135deg,#22d3ee,#0891b2)",
              color: "#04121a",
              border: "none",
              padding: "11px 24px",
              borderRadius: 99,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {busy ? "Writing… (up to ~20s)" : "✦ Generate"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              color: "#f87171",
              fontSize: 13,
              background: "rgba(248,113,113,.1)",
              border: "1px solid rgba(248,113,113,.25)",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {result && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ color: C.dim, fontSize: 13 }}>Preview — classic A4 layout</div>
            <button
              onClick={printDoc}
              style={{
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                border: `1px solid ${C.cyan}55`,
                padding: "9px 20px",
                borderRadius: 99,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              ⤓ Download / Print PDF
            </button>
          </div>
          <iframe
            ref={iframeRef}
            title="document preview"
            srcDoc={docHTML}
            style={{ width: "100%", height: 760, border: "none", borderRadius: 10, background: "#ececec" }}
          />
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 12, marginTop: 10 }}>
            Tip: in the print dialog choose “Save as PDF”. Everything is editable — regenerate with a different tone or job description anytime.
          </div>
        </div>
      )}
    </div>
  );
}
