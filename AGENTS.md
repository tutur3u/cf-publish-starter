# AGENTS.md: publishing for a student

This repo is a beginner template. When the student says "publish this", "đăng lên mạng",
"put my site online" or "share my site", use the helper commands below. Do not invent
another deploy method, and do not edit `scripts/cf-kit.mjs`.

## Which folder

- `static/`: plain HTML/CSS/JS in `static/site/`. Publishes to Cloudflare Pages (`https://<name>.pages.dev`).
- `app/`: TanStack Start + Vite. Publishes to Cloudflare Workers (`https://<name>.<account>.workers.dev`).

Default to `static/` unless the student uses React/TanStack or needs server code.
Reply in the student’s language throughout.

Run every command **inside** `static/` or `app/`, never at the repo root.

## Permanent link (Cloudflare account needed)

1. `npm run check`: Node >= 22, installs deps, builds, picks a name, reports login state. Changes nothing online.
2. Ask for a project name or suggest one from the student’s name/page title; avoid generic defaults.
   `npm run publish -- --name <slug>`: pass `--name` because you are non-interactive
   (lowercase a-z, 0-9, `-`; Vietnamese is converted automatically). The name is saved in
   `package.json` > `cfPublish.name` for next time.
3. Before running publish, tell the student in THEIR language that browser login will open
   on this computer and they must click **Allow**. Vietnamese example: "Một cửa sổ trình duyệt
   sẽ mở trên máy bạn. Đăng nhập Cloudflare (hoặc đăng ký miễn phí) rồi bấm **Allow**."
   Wait up to about 5 minutes for login. If the browser does not open, explain that they can
   open the URL printed after `Opening a link in your default browser:` on the same computer.
   If login fails, times out, or the student is away, do not retry in a loop. Stop only your
   own command and offer `npm run share` as a temporary link; explain it dies when the laptop
   sleeps or closes. Resume permanent publishing when the student is ready.
4. Several Cloudflare accounts: re-run with `--account <id>` (ids are printed).
5. Give the student the exact link printed in the `DONE! Your site is live` box. Do not guess a URL:
   if the name is taken, Cloudflare adds random characters.

## Temporary link (no account)

`npm run share -- --yes` (`--yes` allows downloading the official cloudflared into `.tools/` if missing).
Run it in the background, capture its output, and keep it running until the student asks to stop.
Give the student the `https://*.trycloudflare.com` link and say clearly: it stops
working when this command stops, the laptop sleeps or the lid closes; each run gives a new link;
anyone with the link can open it. Stop with Ctrl+C in its terminal or SIGINT to your own PID when asked.
Ignore `npm warn` / `npm notice` install lines; they are not errors. Do not update npm just for a notice.

## Never

- Never run `npm publish` (npm registry). Always `npm run publish`.
- Never ask for, paste, print or store passwords, API tokens or account IDs in chat or files.
  CI uses the env vars `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, set by the teacher.
- Never list, modify or delete other Cloudflare projects or Workers. Work only on the named project.
- Never use non-Cloudflare hosts.
- Never kill processes you did not start. Use only your own PID or Ctrl+C in your own terminal.

Errors: read the friendly message (Vietnamese, English underneath) and README.md "Sửa lỗi thường gặp" /
README.en.md "Troubleshooting".
