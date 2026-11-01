---
name: publish-site
description: Publish or share the student's website with Cloudflare. Use when asked to publish, deploy, "đăng lên mạng", put the site online, get a link, or share a temporary preview link.
---

# Publish or share the site

Follow `AGENTS.md` at the repo root. Short version:

1. `cd static` (plain HTML) or `cd app` (TanStack Start).
2. Permanent link: `npm run check`, then `npm run publish -- --name <slug>`.
   If it opens the browser, tell the student to log in and click **Allow**, then wait.
   Report the exact URL from the `DONE!` box.
3. Temporary link, no account: `npm run share -- --yes`; report the trycloudflare.com URL
   and warn that it dies when the command stops or the laptop sleeps.

Never run `npm publish`. Never ask for or handle passwords, tokens or account IDs.
