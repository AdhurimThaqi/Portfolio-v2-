# Projects

Every folder in here is one project on the website. To add a project:

1. Copy an existing folder (e.g. `coinquest`) and rename it, e.g. `my-new-game`
   (lowercase, dashes instead of spaces).
2. Edit `project.json` inside it.
3. Put your images in the same folder (`.jpg`, `.png` or `.webp`).
   A file called `cover.*` is shown first; the rest follow alphabetically.
4. Commit and push to `main` — Netlify rebuilds and it's live in ~1 minute.

To remove a project, delete its folder. To hide one without deleting it,
set `"hidden": true`.

## project.json fields

| Field       | Required | What it is |
| ----------- | -------- | ---------- |
| `title`     | yes | Project name |
| `type`      | yes | `"game"` → shows under **Games & VR** (and in the 3D gallery). `"web"` or `"design"` → shows under **Work & Projects** |
| `desc`      | yes | One or two sentences shown on the card |
| `category`  |     | Small badge on the card, e.g. `"2D Platformer"` |
| `tech`      |     | Short line under the title, e.g. `"Unity · C#"` |
| `year`      |     | e.g. `"2026"` |
| `color`     |     | Accent colour, e.g. `"#22d3ee"` |
| `order`     |     | Lower numbers show first |
| `features`  |     | List of key features (shown in the detail popup) |
| `challenge` |     | A problem you hit and how you solved it |
| `stack`     |     | List of tools/tech tags |
| `github`    |     | Link to the code |
| `liveUrl`   |     | Link to the live website |
| `playUrl`   |     | Link to a playable build (e.g. itch.io) — adds a **Play** button |
| `videoUrl`  |     | YouTube or Vimeo link — embeds a video in the popup |
| `hidden`    |     | `true` hides the project |

Keep images under ~500 KB each (1600px wide is plenty) so the site stays fast.

Projects added through `/admin` still work and are shown alongside these.
