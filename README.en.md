# Put a website online with Cloudflare, very simply

[Tiếng Việt → README.md](README.md)

One command publishes your site for free on Cloudflare:

```
npm run publish
```

| Folder | For | Link you get |
| --- | --- | --- |
| [`static/`](static/) | **Beginners.** HTML + CSS + a little JS, no build step. Your files are in `static/site/`. | `https://<name>.pages.dev` (Cloudflare Pages) |
| [`app/`](app/) | React users. TanStack Start + Vite with server code. | `https://<name>.<account>.workers.dev` (Cloudflare Workers) |

## Three ways

| Way | Needs | Link |
| --- | --- | --- |
| **A. Drag and drop in the dashboard** | Free Cloudflare account. No terminal. | Permanent |
| **B. `npm run publish`** | Cloudflare account + Node.js 22+ | Permanent |
| **C. `npm run share`** | Node.js only. No account. | Temporary |

## Setup (once)

1. On GitHub: **Code** → **Download ZIP**, then unzip.
2. Free Cloudflare account: <https://dash.cloudflare.com/sign-up> (for A and B).
3. Node.js **LTS** from <https://nodejs.org> (for B and C). Check with `node -v` (needs v22 or newer).

Open a terminal in the starter folder:
- **Windows:** open `static` in File Explorer, click the address bar, type `cmd`, press Enter.
- **macOS:** open Terminal, type `cd ` (with a space), drag the `static` folder into the window, press Enter.

No terminal wanted? Double-click `Publish-Windows.cmd` / `Share-Windows.cmd` (Windows) or
`Publish-Mac.command` / `Share-Mac.command` (macOS; first time: right-click → Open → Open).

## A. Drag and drop (static only)

1. Edit your site in `static/site/`.
2. Log in at <https://dash.cloudflare.com> and open **Workers & Pages**.
3. **Create application** → **Get started** → **Drag and drop your files**.
4. Enter a project name (it becomes `<name>.pages.dev`).
5. Drag the **`site`** folder (or a .zip of it) into the upload box.
6. **Deploy site**; when the upload finishes, **Save and Deploy**.
7. Live at `https://<project-name>.pages.dev`.

Update later: open the project → **Create a new deployment** → **Production** → upload the folder again.
Limits: 1,000 files, 25 MiB per file. A Direct Upload project cannot be switched to Git deploys later.

## B. `npm run publish`

In `static` (or `app`): `npm run publish`. It checks Node, installs packages (first time 1-3 min),
builds (`app` only), asks for a site name (Enter accepts the suggestion; Vietnamese is converted,
`Bài tập 1` → `bai-tap-1`), opens the browser for Cloudflare login (click **Allow**), creates the
project if needed, uploads, and prints the link in a big `DONE!` box. Run it again to update.
Rename: `npm run publish -- --name new-name`. Dry run without login or upload: `npm run check`.

`app/` deploys to Workers, as Cloudflare's TanStack Start guide does (SSR and server functions need it).
The first time, wrangler may ask "Would you like to register a workers.dev subdomain now?": answer `y`
and choose a name.

## C. `npm run share` (temporary)

`npm run share` starts the site on your computer and opens a Cloudflare Quick Tunnel. If `cloudflared`
is missing it offers to download the official build from GitHub into `.tools/` (SHA-256 checked), or
install it yourself: `brew install cloudflared` (macOS), `winget install --id Cloudflare.cloudflared` (Windows).

The `https://*.trycloudflare.com` link works **only while the computer is awake and the command runs**.
Closing the lid, sleep, losing Wi-Fi or Ctrl+C kills it. Every run gives a new link; anyone with it can
open the site. Per Cloudflare: testing only, no uptime guarantee, 200 in-flight requests max (then 429),
no Server-Sent Events.

## Ask an AI agent

Open the folder in Claude Code or Codex and say "publish this". [`AGENTS.md`](AGENTS.md) and
[`.claude/skills/publish-site/SKILL.md`](.claude/skills/publish-site/SKILL.md) tell it which commands to run.
You click **Allow** in the browser. Never paste passwords or tokens into a chat.

## Troubleshooting

1. **`npm` not recognized / command not found:** install Node LTS, close and reopen the terminal.
2. **PowerShell: `npm.ps1 cannot be loaded because running scripts is disabled`:** use Command Prompt (`cmd`)
   or the `.cmd` launcher, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.
3. **Node too old:** install the current LTS.
4. **Login never finishes:** copy the URL after `Opening a link in your default browser:` into a browser on
   the same computer and click Allow. Or run `npm run login` separately.
5. **Blank page / 404:** `index.html` must be directly inside `static/site/` (or the folder you dragged); file names are case-sensitive.
6. **trycloudflare link fails:** wait 10-20 s and reload; keep the laptop awake; some school/office networks block tunnels, try another network.
7. **Several accounts:** pick the number when asked, or `npm run publish -- --account <id>`.

## Final checks (fresh machine)

| # | Do | Expect |
| --- | --- | --- |
| 1 | `node -v` | `v22.x` or newer |
| 2 | in `static`: `npm run check` | ✓ lines, then `Check finished. Everything before login/deploy is OK.` |
| 3 | `npm run publish`, Enter, log in, Allow | `DONE!` box with `https://<name>.pages.dev` |
| 4 | open it on a phone on mobile data | "Xin chào! 👋" page, button counts |
| 5 | edit `site/index.html`, `npm run publish` again | no name/login prompt; new text online |
| 6 | `npm run share` | `https://….trycloudflare.com` opens on the phone |
| 7 | Ctrl+C, reload on the phone | Cloudflare error (530): expected |
| 8 | in `app`: `npm run publish` | `…workers.dev` link; page says "Chạy trên: Cloudflare-Workers" |

Clean up: dashboard → Workers & Pages → project → Settings → delete.

## For teachers: API token instead of browser login

Set `CLOUDFLARE_API_TOKEN` (dashboard → API Tokens → Create Token → Custom Token → *Account / Cloudflare Pages / Edit*;
add *Workers Scripts / Edit* for `app/`) and `CLOUDFLARE_ACCOUNT_ID`. `npm run publish` then skips the login.
GitHub Actions: see Cloudflare's guide below (`cloudflare/wrangler-action`).

## Sources (Cloudflare docs, checked 1 Nov 2026)

- Pages Direct Upload: <https://developers.cloudflare.com/pages/get-started/direct-upload/>
- `wrangler pages` commands: <https://developers.cloudflare.com/workers/wrangler/commands/pages/>
- Direct Upload with CI: <https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/>
- TanStack Start on Cloudflare: <https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/>
- Quick Tunnels: <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/>

Tips such as "index.html at the top level" and the troubleshooting list are practical advice, not quotes.

License: [MIT](LICENSE).
