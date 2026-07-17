# Portfolio Admin Panel — Setup

Your portfolio now has a private admin panel for managing projects, backed by
Netlify Functions + Netlify Blobs. The public site reads projects from the
backend at runtime and falls back to the built-in game showcase if the backend
is unreachable.

## 1. Set environment variables in Netlify

Go to **Netlify → Site configuration → Environment variables** and add:

| Key                | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| `ADMIN_PASSWORD`   | The password you'll use to sign in to `/admin`           |
| `ADMIN_JWT_SECRET` | A long random string (used to sign login sessions)       |

Generate a good secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Until both variables are set, the login endpoint returns a clear
> "not configured" message and refuses all logins — it fails closed.

## 2. Deploy

Push to your deploy branch (Netlify auto-builds). Netlify auto-detects:

- The static site (`dist/`)
- Functions in `netlify/functions/`
- **Netlify Blobs** — no manual setup, it's provisioned automatically

## 3. Use it

- Open **`https://adhurim.ch/admin`**
- Sign in with `ADMIN_PASSWORD`
- Add / edit / delete projects — changes appear on the live site immediately
  (visitors get them on their next page load)

Each project supports: title, tech line, category badge, year, accent colour,
card emoji, description, tech stack, key features, challenge & solution,
GitHub + live URLs, and up to 6 images (auto-compressed in the browser before
upload, so the stored data stays small).

## Local development

```bash
npm install
npm run dev          # public site only (no functions)
```

To run the functions + Blobs locally, use the Netlify CLI:

```bash
npm i -g netlify-cli
netlify dev          # serves site + /api/* functions + local Blobs
```

Set `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` in a local `.env` for `netlify dev`.

## How it fits together

```
Public site (index.html)  ──GET /api/projects──▶  projects fn ──▶ Netlify Blobs
Admin panel (/admin)      ──POST /api/auth──────▶  auth fn  (issues signed token)
                          ──POST/DELETE /api/projects (Bearer token)──▶ projects fn
```

- `netlify/functions/auth.mjs` — password login, issues an HMAC-signed token
- `netlify/functions/projects.mjs` — public GET; token-gated create/update/delete
- `src/admin/` — the admin React app (separate bundle, never shipped to visitors)
- `useProjects()` in `src/portfolio.jsx` — fetches and merges dynamic projects

## What's next (planned)

The AI application assistant (paste a job description → tailored motivation
letter + resume) will live inside this same admin panel, using an
`ANTHROPIC_API_KEY` environment variable and a new serverless function so the
API key never touches the browser.
