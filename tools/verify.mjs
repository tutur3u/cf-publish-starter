// Repo self-check (no network, no Cloudflare account): node tools/verify.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let bad = 0
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) bad++ }
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

for (const f of ['cf-kit.mjs', 'publish.mjs', 'share.mjs', 'login.mjs'])
  ok(read(`static/scripts/${f}`) === read(`app/scripts/${f}`), `scripts/${f} identical in static/ and app/`)

for (const v of ['static', 'app']) {
  const pkg = JSON.parse(read(`${v}/package.json`))
  ok(pkg.private === true, `${v}: "private": true (blocks accidental npm publish)`)
  ok(pkg.scripts?.publish && pkg.scripts?.share && pkg.scripts?.check, `${v}: publish/share/check scripts`)
  ok(['pages', 'workers'].includes(pkg.cfPublish?.target), `${v}: cfPublish.target = ${pkg.cfPublish?.target}`)
  ok(!pkg.cfPublish?.name && !pkg.cfPublish?.accountId, `${v}: no personal name/account saved in template`)
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  ok(Object.values(deps).every((x) => /^\d+\.\d+\.\d+$/.test(x)), `${v}: all versions pinned exactly`)
  for (const l of ['Publish-Windows.cmd', 'Share-Windows.cmd', 'Publish-Mac.command', 'Share-Mac.command'])
    ok(fs.existsSync(path.join(root, v, l)), `${v}/${l}`)
}
ok(fs.existsSync(path.join(root, 'static/site/index.html')), 'static/site/index.html')

const { slugify } = await import(path.join(root, 'static/scripts/cf-kit.mjs'))
for (const [i, e] of [['Bài tập Cuối kỳ!', 'bai-tap-cuoi-ky'], ['Nguyễn Văn Đạt', 'nguyen-van-dat'], ['--X--', 'x']])
  ok(slugify(i) === e, `slugify(${JSON.stringify(i)}) = ${e}`)

console.log(bad ? `\n${bad} check(s) failed` : '\nall checks passed')
process.exitCode = bad ? 1 : 0
