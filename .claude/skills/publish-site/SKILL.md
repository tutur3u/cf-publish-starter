---
name: publish-site
description: Publish or share the student's website with Cloudflare. Use when asked to publish, deploy, "đăng lên mạng", put the site online, get a link, or share a temporary preview link.
---

# Publish or share the site

Read and follow [the root AGENTS.md](../../../AGENTS.md) for the full publishing rules.
Reply in the student's language.

1. Default to `static/`. Use `app/` only for React/TanStack or server code.
2. Ask for or suggest a project name from the student's name/page title, avoiding generic defaults.
   Run `npm run check`, then `npm run publish -- --name <slug>` inside the template folder.
   The name is saved in `package.json` > `cfPublish.name`. For several accounts, use the
   helper's account selection or `--account <id>`; never paste account IDs in chat.
3. BEFORE publish, explain in the student's language that browser login will open on their
   computer and they must click **Allow**. Wait up to about 5 minutes. If login fails,
   times out, or the student is away, do not retry in a loop. Stop only your own command
   and offer a temporary link. Resume permanent publishing when the student is ready.
4. Temporary link: run `npm run share -- --yes` in the background, read its output and report
   the exact trycloudflare.com URL. Keep it running until asked to stop. Explain that the
   link dies when the command stops, the laptop sleeps or closes; each run gives a new link.
5. Permanent link: report the exact URL in the `DONE!` box. Ignore install `npm warn` /
   `npm notice` lines; these are not errors.

Never run `npm publish`. Never handle passwords or tokens or put account IDs in chat/files.
Never list, modify or delete other Cloudflare projects. Never use non-Cloudflare hosts.
Never kill processes you did not start; stop only your own PID with SIGINT or your own terminal with Ctrl+C.
