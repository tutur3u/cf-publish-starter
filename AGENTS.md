# AGENTS.md: publishing for a student

This repo is a beginner template. When the student says "publish this", "đăng lên mạng",
"put my site online" or "share my site", use the helper commands below. Do not invent
another deploy method, and do not edit `scripts/cf-kit.mjs`.

## Which folder

- `static/`: plain HTML/CSS/JS in `static/site/`. Publishes to Cloudflare Pages (`https://<name>.pages.dev`).
- `app/`: TanStack Start + Vite. Publishes to Cloudflare Workers (`https://<name>.<account>.workers.dev`).

Run every command **inside** `static/` or `app/`, never at the repo root.

## Permanent link (Cloudflare account needed)

1. `npm run check`: Node >= 22, installs deps, builds, picks a name, reports login state. Changes nothing online.
2. `npm run publish -- --name <slug>`: pass `--name` because you are non-interactive
   (lowercase a-z, 0-9, `-`; Vietnamese is converted automatically). The name is saved in
   `package.json` > `cfPublish.name` for next time.
3. If not logged in, the helper runs `wrangler login`, which opens the browser **on this computer**.
   Tell the student: "Log in to Cloudflare (or sign up free) in the browser window and click **Allow**."
   Wait for the command to finish.
4. Several Cloudflare accounts: re-run with `--account <id>` (ids are printed).
5. Give the student the exact link printed in the `DONE! Your site is live` box. Do not guess a URL:
   if the name is taken, Cloudflare adds random characters.

## Temporary link (no account)

`npm run share -- --yes` (`--yes` allows downloading the official cloudflared into `.tools/` if missing).
It keeps running. Give the student the `https://*.trycloudflare.com` link and say clearly: it stops
working when this command stops, the laptop sleeps or the lid closes; each run gives a new link;
anyone with the link can open it. Stop with Ctrl+C (or kill the process) when asked.

## Never

- Never run `npm publish` (npm registry). Always `npm run publish`.
- Never ask for, paste, print or store passwords, API tokens or account IDs in chat or files.
  CI uses the env vars `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, set by the teacher.
- Never delete Cloudflare projects for the student.

Errors: read the friendly message (Vietnamese, English underneath) and README.md "Sửa lỗi thường gặp" /
README.en.md "Troubleshooting".
