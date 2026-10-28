// Converts a project documentation .md into a standalone, styled HTML page.
// Usage: node md2doc.cjs <in.md> <out.html> <config.json>
const fs = require("fs");
const [, , inFile, outFile, cfgFile] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
let md = fs.readFileSync(inFile, "utf8").replace(/\r\n/g, "\n");
if (cfg.cutFrom) {
  const k = md.indexOf(cfg.cutFrom);
  if (k < 0) throw new Error("cutFrom not found");
  md = md.slice(0, k);
}
for (const [from, to] of cfg.replace || []) {
  if (!md.includes(from)) throw new Error("replace target not found: " + from.slice(0, 60));
  md = md.split(from).join(to);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const lines = md.split("\n");
const out = [];
const toc = [];
let i = 0;
let skippedTitle = false;
while (i < lines.length) {
  const line = lines[i];
  if (/^```/.test(line)) {
    const lang = line.slice(3).trim();
    const buf = [];
    i++;
    while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
    i++;
    // Mermaid 11 wants <br/> for line breaks inside labels, not a literal "\n".
    if (lang === "mermaid") out.push(`<figure class="diagram"><pre class="mermaid">${esc(buf.join("\n").replace(/\\n/g, "<br/>"))}</pre></figure>`);
    else out.push(`<pre class="code"><code>${esc(buf.join("\n"))}</code></pre>`);
    continue;
  }
  const h = line.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const level = h[1].length;
    if (level === 1 && !skippedTitle) { skippedTitle = true; i++; continue; } // title is in the page header
    if (level === 2 && /Semester Project Documentation/i.test(h[2])) { i++; continue; }
    const text = inline(h[2]);
    const id = slug(h[2]);
    if (level === 2) toc.push({ id, text });
    out.push(`<h${level} id="${id}">${text}</h${level}>`);
    i++;
    continue;
  }
  if (/^---+\s*$/.test(line)) { i++; continue; } // section rules are handled by CSS spacing
  if (/^\|/.test(line)) {
    const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
    const cells = (r) => r.replace(/^\||\|\s*$/g, "").split("|").map((c) => c.trim());
    const head = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    out.push(
      `<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
        body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
        `</tbody></table></div>`,
    );
    continue;
  }
  if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
    const ordered = /^\s*\d+\./.test(line);
    const items = [];
    while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
      let item = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, "");
      while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) item += " " + lines[i++].trim();
      items.push(`<li>${inline(item)}</li>`);
    }
    out.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
    continue;
  }
  if (!line.trim()) { i++; continue; }
  const para = [];
  while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|\||---+\s*$|\s*([-*]|\d+\.)\s+)/.test(lines[i])) para.push(lines[i++].trim());
  out.push(`<p>${inline(para.join(" "))}</p>`);
}

const tocHtml = toc.map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join("");
const links = (cfg.links || [])
  .map((l, n) => `<a class="btn${n === 0 ? " primary" : ""}" href="${l.href}"${l.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${l.label}</a>`)
  .join("");
const meta = (cfg.meta || []).map((m) => `<span>${m}</span>`).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${cfg.title} — Documentation | Adhurim Thaqi</title>
<meta name="description" content="${cfg.description}" />
<link rel="canonical" href="${cfg.url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${cfg.title} — Documentation" />
<meta property="og:description" content="${cfg.description}" />
<meta property="og:url" content="${cfg.url}" />
<meta property="og:image" content="https://adhurim.ch/og-image.png" />
<meta name="theme-color" content="#05050a" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: cfg.title + " — Project Documentation",
  description: cfg.description,
  url: cfg.url,
  author: { "@type": "Person", name: "Adhurim Thaqi", url: "https://adhurim.ch/" },
  about: cfg.keywords,
})}</script>
<style>
:root{--bg:#05050a;--panel:rgba(255,255,255,.035);--line:rgba(255,255,255,.08);--ink:#e8edf5;--dim:rgba(255,255,255,.58);--cyan:#22d3ee;--violet:#c084fc;--accent:${cfg.color || "#22d3ee"}}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.7 Outfit,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--cyan)}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
header.hero{border-bottom:1px solid var(--line);background:radial-gradient(ellipse 70% 120% at 20% 0%,rgba(34,211,238,.10),transparent 60%),radial-gradient(ellipse 60% 120% at 90% 10%,rgba(192,132,252,.10),transparent 60%)}
.top{display:flex;justify-content:space-between;align-items:center;padding:18px 0}
.brand{font:800 20px Syne,sans-serif;text-decoration:none;color:var(--ink)}.brand b{color:var(--cyan)}
.back{color:var(--dim);text-decoration:none;font-size:14px}.back:hover{color:var(--cyan)}
.hero-body{padding:36px 0 44px}
.kicker{color:var(--accent);font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:600}
h1{font:800 clamp(2rem,5vw,3.4rem)/1.05 Syne,sans-serif;margin:12px 0 14px;background:linear-gradient(135deg,#fff 30%,#a5f3fc 65%,#e879f9);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:var(--dim);font-size:18px;max-width:720px;margin:0 0 20px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.meta span{padding:4px 12px;border-radius:99px;border:1px solid var(--line);background:var(--panel);font-size:13px;color:var(--dim)}
.btns{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:99px;border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.08);color:#a5f3fc;text-decoration:none;font-weight:600;font-size:14px}
.btn.primary{background:linear-gradient(135deg,#22d3ee,#a78bfa);color:#05121a;border:none}
.btn:hover{filter:brightness(1.15)}
.layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:48px;padding:40px 0 100px}
nav.toc{position:sticky;top:24px;align-self:start;font-size:14px}
nav.toc .label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
nav.toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--line)}
nav.toc a{display:block;padding:5px 0 5px 14px;color:var(--dim);text-decoration:none;margin-left:-1px;border-left:1px solid transparent}
nav.toc a:hover,nav.toc a.on{color:var(--ink);border-left-color:var(--cyan)}
article{min-width:0}
article h2{font:800 1.7rem/1.2 Syne,sans-serif;margin:64px 0 18px;padding-top:28px;border-top:1px solid var(--line)}
article h2:first-child{margin-top:0;padding-top:0;border-top:0}
article h3{font:700 1.2rem/1.3 Syne,sans-serif;margin:36px 0 10px;color:#fff}
article h4{margin:24px 0 8px}
article p,article li{color:rgba(255,255,255,.78)}
article strong{color:#fff;font-weight:600}
code{font:500 .86em 'JetBrains Mono',ui-monospace,monospace;background:rgba(34,211,238,.08);color:#a5f3fc;padding:.12em .4em;border-radius:6px}
pre.code{background:#0a0a14;border:1px solid var(--line);border-radius:14px;padding:16px 18px;overflow-x:auto;font-size:14px;line-height:1.55}
pre.code code{background:none;padding:0;color:#d6e2f0}
.table{overflow-x:auto;border:1px solid var(--line);border-radius:14px;margin:18px 0}
table{border-collapse:collapse;width:100%;font-size:14.5px}
th{background:rgba(34,211,238,.06);color:#fff;text-align:left;font-weight:600}
th,td{padding:10px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
figure.diagram{margin:20px 0;padding:20px;background:#fff;color:#1f2937;border-radius:16px;overflow-x:auto}
figure.diagram p,figure.diagram span,figure.diagram div{color:#1f2937}
figure.diagram pre.mermaid{margin:0;display:flex;justify-content:center;color:#05050a;background:none}
footer{border-top:1px solid var(--line);padding:28px 0;color:var(--dim);font-size:14px}
@media(max-width:900px){.layout{grid-template-columns:1fr;gap:0}nav.toc{display:none}}
</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <div class="top"><a class="brand" href="/"><b>A</b>T</a><a class="back" href="/#projects">← Back to portfolio</a></div>
  <div class="hero-body">
    <div class="kicker">${cfg.kicker}</div>
    <h1>${cfg.title}</h1>
    <p class="lead">${cfg.lead}</p>
    <div class="meta">${meta}</div>
    <div class="btns">${links}</div>
  </div>
</div></header>
<div class="wrap layout">
  <nav class="toc" aria-label="Contents"><div class="label">Contents</div><ol>${tocHtml}</ol></nav>
  <article>
${out.join("\n")}
  </article>
</div>
<footer><div class="wrap">Documentation by <a href="/">Adhurim Thaqi</a> · ${cfg.footer}</div></footer>
<script type="module">
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
mermaid.initialize({ startOnLoad: true, theme: "default", securityLevel: "strict", fontFamily: "Outfit, sans-serif" });
const links = [...document.querySelectorAll("nav.toc a")];
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "0px 0px -70% 0px" });
document.querySelectorAll("article h2[id]").forEach((h) => io.observe(h));
</script>
</body>
</html>
`;
fs.mkdirSync(require("path").dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log("wrote", outFile, html.length, "bytes,", toc.length, "sections");
