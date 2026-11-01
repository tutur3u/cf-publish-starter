// cf-kit.mjs: the shared "publish / share" helper for both starters.
// Plain Node (>= 22), no dependencies, works on Windows, macOS and Linux.
// The same file lives in static/scripts and app/scripts; keep them identical
// (tools/verify.mjs checks this).
//
//   npm run publish  -> build (if needed), log in, create the project, deploy,
//                       print the public https link
//   npm run share    -> start the site locally + a Cloudflare Quick Tunnel,
//                       print a temporary https://*.trycloudflare.com link
//   npm run check    -> everything up to (not including) login and deploy
//
// Settings live in package.json under "cfPublish":
//   target:    "pages" (static folder -> <name>.pages.dev)
//              "workers" (TanStack Start app -> <name>.<you>.workers.dev)
//   outputDir: folder to upload (pages only)
//   build:     npm script to run before publishing / sharing (or null)
//   serve:     "static" (built-in file server) or "vite-preview"
//   name:      saved project name (written on the first publish)

import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG_PATH = path.join(ROOT, 'package.json')
const IS_WIN = process.platform === 'win32'
const TTY = Boolean(process.stdin.isTTY && process.stdout.isTTY)

// ---------------------------------------------------------------- output ---

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code) => (s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s))
const bold = paint('1')
const dim = paint('2')
const green = paint('32')
const yellow = paint('33')
const red = paint('31')
const cyan = paint('36')

/** Vietnamese first, English underneath (dimmed). */
export function say(vi, en, mark = '•') {
  console.log(`${mark} ${vi}`)
  if (en) console.log(dim(`  ${en}`))
}
export const step = (n, vi, en) => {
  console.log('')
  console.log(bold(cyan(`[${n}] ${vi}`)))
  if (en) console.log(dim(`    ${en}`))
}
export const warn = (vi, en) => say(yellow(vi), en, yellow('!'))

export class FriendlyError extends Error {
  constructor(vi, en, hint) {
    super(en || vi)
    this.vi = vi
    this.en = en
    this.hint = hint
  }
}

export function banner(title, url, lines = []) {
  const rule = '='.repeat(Math.min(Math.max(url.length + 8, 44), 78))
  console.log('')
  console.log(green(rule))
  console.log('')
  console.log(`   ${bold(title)}`)
  console.log('')
  console.log(`   ${bold(green('>>>'))}  ${bold(cyan(url))}  ${bold(green('<<<'))}`)
  console.log('')
  for (const l of lines) console.log(`   ${l}`)
  if (lines.length) console.log('')
  console.log(green(rule))
  console.log('')
}

function fail(err) {
  console.log('')
  if (err instanceof FriendlyError) {
    console.log(red(bold('✗ ' + err.vi)))
    if (err.en) console.log(dim('  ' + err.en))
    if (err.hint) {
      console.log('')
      for (const l of [].concat(err.hint)) console.log('  ' + l)
    }
  } else {
    console.log(red(bold('✗ Có lỗi không mong muốn / Unexpected error')))
    console.log(err && err.stack ? err.stack : String(err))
  }
  console.log('')
  console.log(dim('  Xem README.md, mục "Sửa lỗi thường gặp" / See README.en.md, "Troubleshooting".'))
  process.exitCode = 1
}

// ------------------------------------------------------------------ args ---

export function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      out._.push(a)
      continue
    }
    const [k, v] = a.slice(2).split('=', 2)
    if (v !== undefined) out[k] = v
    else if (argv[i + 1] && !argv[i + 1].startsWith('--') && ['name', 'account', 'port'].includes(k)) out[k] = argv[++i]
    else out[k] = true
  }
  return out
}

// --------------------------------------------------------------- config ---

export function readPkg() {
  return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'))
}
function settings() {
  const s = readPkg().cfPublish || {}
  return { target: 'pages', outputDir: 'dist', build: null, serve: 'static', name: null, ...s }
}
function saveSetting(key, value) {
  const pkg = readPkg()
  pkg.cfPublish = { ...(pkg.cfPublish || {}), [key]: value }
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n')
}

// ------------------------------------------------------------ names -------

/**
 * Turn any folder name (including Vietnamese) into a safe Cloudflare name:
 * lowercase a-z, 0-9 and "-", no leading/trailing "-", at most 58 characters.
 * "Bài tập Cuối kỳ!" -> "bai-tap-cuoi-ky"
 */
export function slugify(input) {
  return String(input || '')
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 58)
    .replace(/-+$/g, '')
}

const GENERIC = new Set(['static', 'app', 'site', 'web', 'www', 'src', 'dist', 'public', 'project', 'my-app', 'cf-publish-starter'])

export function suggestName(dir = ROOT) {
  const base = slugify(path.basename(dir))
  if (base && !GENERIC.has(base)) return base
  const parent = slugify(path.basename(path.dirname(dir)))
  if (parent && !GENERIC.has(parent) && base) return slugify(`${parent}-${base}`)
  return 'my-site'
}

async function ask(question, fallback) {
  if (!TTY) return fallback
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const a = (await rl.question(question)).trim()
    return a || fallback
  } finally {
    rl.close()
  }
}

async function resolveName(args) {
  const s = settings()
  const given = args.name || process.env.CF_PROJECT_NAME
  if (given) {
    const n = slugify(given)
    if (!n) throw new FriendlyError(`Tên "${given}" không dùng được.`, `The name "${given}" is not usable.`, 'Dùng chữ thường, số và dấu gạch ngang, ví dụ: bai-tap-1 / Use a-z, 0-9 and "-", e.g. homework-1')
    return { name: n, save: true }
  }
  if (s.name) return { name: slugify(s.name), save: false }
  const suggestion = suggestName()
  if (!TTY || args.yes) return { name: suggestion, save: true }
  console.log('')
  say('Đặt tên cho trang web. Tên này sẽ nằm trong đường link.', 'Pick a name for your site. It becomes part of the link.')
  say(`Nhấn Enter để dùng tên gợi ý: ${bold(suggestion)}`, 'Press Enter to accept the suggestion.')
  const answer = await ask('  Tên / Name: ', suggestion)
  const n = slugify(answer)
  if (!n) throw new FriendlyError('Tên không hợp lệ.', 'Invalid name.')
  if (n !== answer) say(`Tên đã được chuẩn hoá thành: ${bold(n)}`, `Normalised to: ${n}`)
  return { name: n, save: true }
}

// ------------------------------------------------------------ processes ---

/**
 * Run a program. mode: "inherit" (student sees and answers everything),
 * "capture" (quiet, we read the output). No shell is used for node or .exe
 * targets, so paths with spaces or Vietnamese letters are safe on Windows.
 */
export function run(cmd, args, { mode = 'inherit', env = {}, cwd = ROOT, shell = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell,
      env: { ...process.env, ...env },
      stdio: mode === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let out = ''
    let err = ''
    child.stdout?.on('data', (d) => (out += d))
    child.stderr?.on('data', (d) => (err += d))
    child.on('error', (e) => resolve({ code: 127, out, err: err + String(e) }))
    child.on('close', (code) => resolve({ code: code ?? 1, out, err }))
  })
}

function npmCommand(args) {
  const cli = process.env.npm_execpath
  if (cli && /\.(c?js)$/.test(cli)) return [process.execPath, [cli, ...args], false]
  // Not started through npm (e.g. `node scripts/publish.mjs`): use the shell.
  return [IS_WIN ? 'npm.cmd' : 'npm', args, IS_WIN]
}
export async function npm(args, opts = {}) {
  const [cmd, a, shell] = npmCommand(args)
  return run(cmd, a, { ...opts, shell })
}

function depsMissing() {
  const pkg = readPkg()
  const names = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })
  return names.filter((n) => !fs.existsSync(path.join(ROOT, 'node_modules', n, 'package.json')))
}

export async function ensureDeps() {
  const missing = depsMissing()
  if (!missing.length) {
    say('Các gói cần thiết đã có sẵn.', 'Dependencies already installed.', green('✓'))
    return
  }
  say('Đang cài các gói cần thiết (lần đầu có thể mất 1-3 phút)...', 'Installing dependencies (first time can take 1-3 minutes)...')
  const r = await npm(['install', '--no-audit', '--no-fund'])
  if (r.code !== 0)
    throw new FriendlyError('Cài gói thất bại.', 'npm install failed.', [
      'Kiểm tra kết nối mạng rồi chạy lại. / Check your internet connection and try again.',
      'Nếu vẫn lỗi: xoá thư mục node_modules rồi chạy lại. / Still failing: delete node_modules and retry.',
    ])
}

function wranglerBin() {
  const p = path.join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
  if (!fs.existsSync(p)) throw new FriendlyError('Không tìm thấy wrangler.', 'wrangler is not installed.', 'Chạy / Run: npm install')
  return p
}

const WRANGLER_ENV = { WRANGLER_NO_SKILLS_UPDATE_PROMPTS: 'true', WRANGLER_HIDE_BANNER: 'true' }
export function wrangler(args, opts = {}) {
  return run(process.execPath, [wranglerBin(), ...args], { ...opts, env: { ...WRANGLER_ENV, ...(opts.env || {}) } })
}

// --------------------------------------------------------------- checks ---

export function checkNode() {
  const major = Number(process.versions.node.split('.')[0])
  if (major < 22)
    throw new FriendlyError(
      `Node.js của bạn là ${process.versions.node}, cần bản 22 trở lên.`,
      `Your Node.js is ${process.versions.node}; version 22 or newer is required.`,
      'Tải bản "LTS" tại https://nodejs.org rồi mở lại cửa sổ dòng lệnh. / Install the LTS from https://nodejs.org and reopen the terminal.',
    )
  say(`Node.js ${process.versions.node} (${process.platform}/${process.arch})`, null, green('✓'))
}

async function build(s) {
  if (!s.build) {
    say('Không cần build (trang tĩnh).', 'No build step (static site).', green('✓'))
    return
  }
  say(`Đang build: npm run ${s.build}`, `Building: npm run ${s.build}`)
  const r = await npm(['run', s.build])
  if (r.code !== 0)
    throw new FriendlyError('Build bị lỗi. Đọc dòng lỗi màu đỏ ở trên.', 'The build failed. Read the red error lines above.', 'Thường là lỗi gõ trong code vừa sửa. / Usually a typo in code you just changed.')
  say('Build xong.', 'Build finished.', green('✓'))
}

function outputDir(s) {
  const dir = path.resolve(ROOT, s.outputDir)
  if (!fs.existsSync(path.join(dir, 'index.html')))
    throw new FriendlyError(
      `Không thấy ${path.join(s.outputDir, 'index.html')}.`,
      `${path.join(s.outputDir, 'index.html')} not found.`,
      `Trang chủ phải tên là index.html và nằm ngay trong thư mục "${s.outputDir}". / The home page must be named index.html, directly inside "${s.outputDir}".`,
    )
  return dir
}

// ---------------------------------------------------------------- auth -----

function parseJson(text) {
  const t = String(text)
  for (const [a, b] of [['{', '}'], ['[', ']']]) {
    const i = t.indexOf(a)
    const j = t.lastIndexOf(b)
    if (i !== -1 && j > i) {
      try {
        return JSON.parse(t.slice(i, j + 1))
      } catch {}
    }
  }
  return null
}

async function whoami() {
  const r = await wrangler(['whoami', '--json'], { mode: 'capture' })
  const j = parseJson(r.out) || {}
  return { loggedIn: r.code === 0 && j.loggedIn !== false, info: j }
}

/** Returns env vars (account id) to pass to later wrangler calls. */
async function ensureAuth(args, { checkOnly = false } = {}) {
  const env = {}
  if (args.account) env.CLOUDFLARE_ACCOUNT_ID = String(args.account)
  if (process.env.CLOUDFLARE_API_TOKEN) {
    say('Dùng API token trong biến môi trường CLOUDFLARE_API_TOKEN.', 'Using the API token from CLOUDFLARE_API_TOKEN.', green('✓'))
    if (!process.env.CLOUDFLARE_ACCOUNT_ID && !env.CLOUDFLARE_ACCOUNT_ID)
      warn('Nên đặt thêm CLOUDFLARE_ACCOUNT_ID.', 'Also set CLOUDFLARE_ACCOUNT_ID (recommended with a token).')
  }
  let me = await whoami()
  if (!me.loggedIn) {
    if (process.env.CLOUDFLARE_API_TOKEN)
      throw new FriendlyError('API token không dùng được.', 'The API token was rejected.', 'Kiểm tra lại token và quyền "Cloudflare Pages: Edit" / "Workers Scripts: Edit". / Check the token and its permissions.')
    if (checkOnly) {
      say('Chưa đăng nhập Cloudflare. Lệnh publish sẽ mở trình duyệt để bạn đăng nhập.', 'Not logged in. `npm run publish` would now open the browser to log in (wrangler login).', yellow('→'))
      return null
    }
    if (process.env.CI)
      throw new FriendlyError('Đang chạy trong CI nên không đăng nhập bằng trình duyệt được.', 'Running in CI: browser login is not possible.', 'Đặt CLOUDFLARE_API_TOKEN và CLOUDFLARE_ACCOUNT_ID. / Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.')
    say('Trình duyệt sẽ mở trang Cloudflare. Đăng nhập (hoặc tạo tài khoản miễn phí), rồi bấm "Allow".', 'Your browser will open Cloudflare. Log in (or sign up free), then click "Allow".', yellow('→'))
    say('Xong thì quay lại cửa sổ này.', 'Then come back to this window.', yellow('→'))
    const r = await wrangler(['login'], { mode: 'inherit' })
    me = await whoami()
    if (r.code !== 0 || !me.loggedIn)
      throw new FriendlyError('Đăng nhập chưa thành công.', 'Login did not complete.', [
        'Chạy lại lệnh và bấm "Allow" trên trang Cloudflare. / Run again and click "Allow".',
        'Trình duyệt không tự mở? Copy đường link hiện ở trên vào trình duyệt. / Browser did not open? Copy the link printed above into it.',
      ])
  }
  if (me.info.email) say(`Đã đăng nhập: ${me.info.email}`, `Logged in as ${me.info.email}`, green('✓'))
  else say('Đã đăng nhập Cloudflare.', 'Logged in to Cloudflare.', green('✓'))

  const accounts = Array.isArray(me.info.accounts) ? me.info.accounts : []
  if (!env.CLOUDFLARE_ACCOUNT_ID && !process.env.CLOUDFLARE_ACCOUNT_ID && accounts.length > 1) {
    const saved = settings().accountId
    if (saved && accounts.some((a) => a.id === saved)) env.CLOUDFLARE_ACCOUNT_ID = saved
    else {
      console.log('')
      say('Bạn có nhiều tài khoản Cloudflare. Chọn một:', 'You have several Cloudflare accounts. Pick one:')
      accounts.forEach((a, i) => console.log(`    ${i + 1}. ${a.name} ${dim(a.id)}`))
      if (!TTY)
        throw new FriendlyError('Cần chọn tài khoản.', 'An account must be chosen.', 'Chạy lại với / Re-run with: npm run publish -- --account <id>')
      const pick = Number(await ask('  Số / Number: ', '1'))
      const acc = accounts[pick - 1] || accounts[0]
      env.CLOUDFLARE_ACCOUNT_ID = acc.id
      saveSetting('accountId', acc.id)
    }
  }
  return env
}

// ------------------------------------------------------------- deploys ----

function readOutputFile(file) {
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function outputFilePath() {
  const dir = path.join(ROOT, '.wrangler')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'publish-output.ndjson')
  fs.rmSync(file, { force: true })
  return file
}

async function deployPages(name, dir, env) {
  const list = await wrangler(['pages', 'project', 'list', '--json'], { mode: 'capture', env })
  if (list.code !== 0)
    throw new FriendlyError('Không đọc được danh sách dự án Pages.', 'Could not list your Pages projects.', (list.err || list.out).trim().split('\n').slice(-8))
  const projects = parseJson(list.out) || []
  const exists = projects.some((p) => (p['Project Name'] || p.name) === name)
  if (exists) say(`Dự án "${name}" đã có, sẽ cập nhật bản mới.`, `Project "${name}" exists; deploying a new version.`, green('✓'))
  else {
    say(`Tạo dự án Pages mới: ${name}`, `Creating Pages project: ${name}`)
    const c = await wrangler(['pages', 'project', 'create', name, '--production-branch', 'main'], { env })
    if (c.code !== 0) throw new FriendlyError('Tạo dự án thất bại (xem lỗi ở trên).', 'Creating the project failed (see above).', 'Thử tên khác: npm run publish -- --name ten-khac / Try another name.')
  }
  const out = outputFilePath()
  say('Đang tải trang web lên Cloudflare...', 'Uploading your site to Cloudflare...')
  const d = await wrangler(['pages', 'deploy', dir, '--project-name', name, '--branch', 'main', '--commit-dirty=true'], {
    env: { ...env, WRANGLER_OUTPUT_FILE_PATH: out },
  })
  if (d.code !== 0) throw new FriendlyError('Tải lên thất bại (xem lỗi ở trên).', 'Upload failed (see above).')
  const entry = readOutputFile(out).find((e) => e.type === 'pages-deploy-detailed' || e.type === 'pages-deploy')
  // The deployment URL is https://<hash>.<project-subdomain>.pages.dev;
  // the permanent production link is the same host without the first label.
  let prod = `https://${name}.pages.dev`
  if (entry?.url) {
    try {
      const host = new URL(entry.url).hostname.split('.')
      if (host.length >= 4) prod = `https://${host.slice(1).join('.')}`
    } catch {}
  }
  return { url: prod, extra: entry?.url }
}

async function deployWorkers(name, env) {
  const out = outputFilePath()
  say('Đang đưa ứng dụng lên Cloudflare Workers...', 'Deploying your app to Cloudflare Workers...')
  const d = await wrangler(['deploy', '--name', name], { env: { ...env, WRANGLER_OUTPUT_FILE_PATH: out } })
  if (d.code !== 0)
    throw new FriendlyError('Deploy thất bại (xem lỗi ở trên).', 'Deploy failed (see above).', [
      'Nếu được hỏi "register a workers.dev subdomain", chọn Yes và đặt một tên. / If asked to register a workers.dev subdomain, answer Yes and pick a name.',
    ])
  const entry = readOutputFile(out).find((e) => e.type === 'deploy')
  const url = (entry?.targets || []).find((t) => /workers\.dev/.test(t)) || entry?.targets?.[0]
  return { url: url ? (url.startsWith('http') ? url : `https://${url}`) : null }
}

// --------------------------------------------------------------- publish --

export async function publish(argv) {
  const args = parseArgs(argv)
  const checkOnly = Boolean(args.check)
  try {
    const s = settings()
    console.log(bold(`\nCloudflare publish helper (${s.target})${checkOnly ? '  [check only]' : ''}`))

    step(1, 'Kiểm tra máy', 'Checking this computer')
    checkNode()

    step(2, 'Chuẩn bị', 'Getting ready')
    await ensureDeps()
    await build(s)
    let dir = null
    if (s.target === 'pages') {
      dir = outputDir(s)
      say(`Thư mục sẽ được đăng: ${path.relative(ROOT, dir) || '.'}`, `Folder to publish: ${s.outputDir}`, green('✓'))
    }
    const { name, save } = await resolveName(args)
    say(`Tên dự án: ${bold(name)}`, `Project name: ${name}`, green('✓'))

    step(3, 'Đăng nhập Cloudflare', 'Cloudflare login')
    const env = await ensureAuth(args, { checkOnly })
    if (checkOnly) {
      console.log('')
      say(green('Kiểm tra xong. Mọi thứ trước bước đăng nhập/deploy đều ổn.'), 'Check finished. Everything before login/deploy is OK.', green('✓'))
      return
    }
    if (save) saveSetting('name', name)

    step(4, 'Đăng lên mạng', 'Publishing')
    const res = s.target === 'workers' ? await deployWorkers(name, env) : await deployPages(name, dir, env)
    if (!res.url) {
      say('Đã deploy xong nhưng không đọc được đường link. Xem dòng "https://" ở trên.', 'Deployed, but the link could not be read; look for the https:// line above.', yellow('!'))
      return
    }
    banner('XONG! Trang web của bạn đã lên mạng / DONE! Your site is live:', res.url, [
      'Gửi đường link này cho mọi người. Link vẫn chạy khi bạn tắt máy.',
      dim('Share this link. It keeps working after you turn your computer off.'),
      'Lần đầu có thể mất ~1 phút mới mở được. / First visit may take ~1 minute.',
      'Sửa xong muốn cập nhật? Chạy lại: npm run publish',
      dim('Changed something? Run npm run publish again.'),
    ])
  } catch (e) {
    fail(e)
  }
}

// ---------------------------------------------------------------- share ---

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.pdf': 'application/pdf', '.wasm': 'application/wasm',
}

export function startStaticServer(dir, port) {
  const root = path.resolve(dir)
  const server = http.createServer((req, res) => {
    let rel
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    } catch {
      res.writeHead(400).end('Bad request')
      return
    }
    let file = path.resolve(root, '.' + rel)
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'
    if (!fs.existsSync(file)) {
      const nf = path.join(root, '404.html')
      res.writeHead(404, { 'content-type': MIME['.html'] })
      res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : '<h1>404</h1>')
      return
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer()
    s.once('error', () => resolve(false))
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)))
  })
}
export async function freePort(start) {
  for (let p = start; p < start + 50; p++) if (await portFree(p)) return p
  throw new FriendlyError('Không tìm được cổng trống.', 'No free port found.')
}

async function waitForHttp(url, ms = 90_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      const r = await fetch(url)
      await r.arrayBuffer()
      return r.status
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new FriendlyError('Máy chủ cục bộ không chạy lên được.', `The local server did not start (${url}).`)
}

// cloudflared: find it, or download the official binary into .tools/

const TOOLS = path.join(ROOT, '.tools')
const CF_EXE = IS_WIN ? 'cloudflared.exe' : 'cloudflared'

export function findCloudflared() {
  const candidates = []
  if (process.env.CLOUDFLARED_PATH) candidates.push(process.env.CLOUDFLARED_PATH)
  candidates.push(path.join(TOOLS, CF_EXE))
  for (const d of (process.env.PATH || '').split(path.delimiter)) if (d) candidates.push(path.join(d, CF_EXE))
  if (IS_WIN) {
    for (const base of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles]) if (base) candidates.push(path.join(base, 'cloudflared', CF_EXE))
    if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', CF_EXE))
  } else candidates.push('/opt/homebrew/bin/cloudflared', '/usr/local/bin/cloudflared', '/usr/bin/cloudflared')
  return candidates.find((c) => {
    try {
      return fs.statSync(c).isFile()
    } catch {
      return false
    }
  })
}

function cloudflaredAsset() {
  const a = process.arch
  if (process.platform === 'darwin') return a === 'arm64' ? 'cloudflared-darwin-arm64.tgz' : 'cloudflared-darwin-amd64.tgz'
  if (IS_WIN) return a === 'ia32' ? 'cloudflared-windows-386.exe' : 'cloudflared-windows-amd64.exe'
  if (process.platform === 'linux') return { x64: 'cloudflared-linux-amd64', arm64: 'cloudflared-linux-arm64', arm: 'cloudflared-linux-arm', ia32: 'cloudflared-linux-386' }[a]
  return null
}

export const CLOUDFLARED_INSTALL_HINTS = [
  'macOS:   brew install cloudflared',
  'Windows: winget install --id Cloudflare.cloudflared   (mở lại cửa sổ lệnh sau khi cài / reopen the terminal afterwards)',
  'Linux:   https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/',
  'Hoặc / Or: https://github.com/cloudflare/cloudflared/releases/latest',
]

export async function downloadCloudflared() {
  const asset = cloudflaredAsset()
  if (!asset) throw new FriendlyError('Máy này chưa được hỗ trợ tải tự động.', 'Automatic download is not supported on this system.', CLOUDFLARED_INSTALL_HINTS)
  say('Đang hỏi GitHub bản cloudflared mới nhất...', 'Looking up the latest cloudflared release on GitHub...')
  const rel = await fetch('https://api.github.com/repos/cloudflare/cloudflared/releases/latest', { headers: { accept: 'application/vnd.github+json', 'user-agent': 'cf-publish-starter' } })
  if (!rel.ok) throw new FriendlyError(`GitHub trả lỗi ${rel.status}.`, `GitHub answered ${rel.status} (rate limit or no internet).`, ['Cài cloudflared bằng tay / Install cloudflared manually:', ...CLOUDFLARED_INSTALL_HINTS])
  const info = await rel.json()
  const a = (info.assets || []).find((x) => x.name === asset)
  if (!a) throw new FriendlyError(`Không thấy file ${asset}.`, `Release asset ${asset} not found.`, CLOUDFLARED_INSTALL_HINTS)
  say(`Đang tải ${asset} (${Math.round(a.size / 1e6)} MB, bản ${info.tag_name})...`, `Downloading ${asset} (${info.tag_name})...`)
  const res = await fetch(a.browser_download_url, { headers: { 'user-agent': 'cf-publish-starter' } })
  if (!res.ok) throw new FriendlyError('Tải cloudflared thất bại.', `Download failed (${res.status}).`, CLOUDFLARED_INSTALL_HINTS)
  const buf = Buffer.from(await res.arrayBuffer())
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  const expected = String(a.digest || '').replace(/^sha256:/, '')
  if (expected && expected !== sha) throw new FriendlyError('File tải về bị sai (checksum).', 'Checksum mismatch: the download is corrupted.', 'Chạy lại / Try again.')
  say(expected ? 'Đã kiểm tra SHA-256 khớp với GitHub.' : 'GitHub không cung cấp SHA-256; bỏ qua kiểm tra.', expected ? 'SHA-256 matches the GitHub release.' : 'No SHA-256 published; not verified.', expected ? green('✓') : yellow('!'))
  fs.mkdirSync(TOOLS, { recursive: true })
  const dest = path.join(TOOLS, CF_EXE)
  if (asset.endsWith('.tgz')) {
    const tgz = path.join(TOOLS, asset)
    fs.writeFileSync(tgz, buf)
    const t = await run('tar', ['-xzf', tgz, '-C', TOOLS], { mode: 'capture' })
    fs.rmSync(tgz, { force: true })
    if (t.code !== 0 || !fs.existsSync(dest)) throw new FriendlyError('Giải nén cloudflared thất bại.', 'Could not unpack cloudflared.', CLOUDFLARED_INSTALL_HINTS)
  } else fs.writeFileSync(dest, buf)
  if (!IS_WIN) fs.chmodSync(dest, 0o755)
  return dest
}

async function getCloudflared(args) {
  const found = findCloudflared()
  if (found) {
    say(`cloudflared: ${found}`, null, green('✓'))
    return found
  }
  warn('Chưa có cloudflared (chương trình tạo đường hầm của Cloudflare).', 'cloudflared (Cloudflare\'s tunnel program) is not installed.')
  console.log('')
  for (const h of CLOUDFLARED_INSTALL_HINTS) console.log('    ' + h)
  console.log('')
  let ok = Boolean(args.yes)
  if (!ok && TTY) ok = /^(y|yes|c|co|có|)$/i.test((await ask('  Tự tải bản chính thức từ GitHub vào thư mục .tools? (Y/n) / Download the official build into .tools? (Y/n) ', 'y')).trim())
  if (!ok) throw new FriendlyError('Cần cài cloudflared trước.', 'Install cloudflared first (see above), or re-run with: npm run share -- --yes', CLOUDFLARED_INSTALL_HINTS)
  return downloadCloudflared()
}

export async function share(argv) {
  const args = parseArgs(argv)
  const children = []
  let server = null
  const cleanup = () => {
    for (const c of children) {
      try {
        c.kill()
      } catch {}
    }
    server?.close()
  }
  process.on('SIGINT', () => {
    console.log('\n' + dim('Đã dừng. Link tạm thời không còn dùng được nữa. / Stopped; the temporary link no longer works.'))
    cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    cleanup()
    process.exit(0)
  })
  try {
    const s = settings()
    console.log(bold('\nCloudflare Quick Tunnel: chia sẻ tạm thời / temporary share'))

    step(1, 'Kiểm tra máy', 'Checking this computer')
    checkNode()
    const cf = await getCloudflared(args)

    step(2, 'Chạy trang web trên máy bạn', 'Starting your site on this computer')
    const port = await freePort(Number(args.port) || (s.serve === 'vite-preview' ? 4173 : 8080))
    const local = `http://127.0.0.1:${port}`
    if (s.serve === 'vite-preview') {
      await ensureDeps()
      await build(s)
      const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
      const child = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
      children.push(child)
      child.stdout.on('data', () => {})
      child.stderr.on('data', (d) => process.stderr.write(dim(String(d))))
    } else {
      server = await startStaticServer(outputDir(s), port)
    }
    await waitForHttp(local)
    say(`Trang web đang chạy tại ${local}`, `Site is running locally at ${local}`, green('✓'))

    step(3, 'Mở đường hầm Cloudflare (không cần tài khoản)', 'Opening a Cloudflare Quick Tunnel (no account needed)')
    const logFile = path.join(TOOLS, 'cloudflared.log')
    fs.mkdirSync(TOOLS, { recursive: true })
    const log = fs.createWriteStream(logFile)
    const t = spawn(cf, ['tunnel', '--no-autoupdate', '--url', local], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    children.push(t)
    let text = ''
    let url = null
    let announced = false
    const announce = () => {
      if (announced || !url) return
      announced = true
      banner('Link tạm thời của bạn / Your temporary link:', url, [
        yellow('Link này CHỈ chạy khi máy bạn đang mở và cửa sổ này còn chạy.'),
        dim('It works ONLY while this computer is awake and this window stays open.'),
        yellow('Gập máy, máy ngủ, mất mạng hoặc bấm Ctrl+C = link chết.'),
        dim('Closing the lid, sleep, losing Wi-Fi or pressing Ctrl+C kills the link.'),
        'Mỗi lần chạy lại sẽ ra link MỚI. Ai có link đều xem được.',
        dim('Each run gives a NEW link. Anyone with the link can open it.'),
        'Cần link lâu dài? Dùng: npm run publish',
        dim('Need a permanent link? Use: npm run publish'),
        '',
        'Nếu link báo lỗi, đợi 10-20 giây rồi tải lại trang.',
        dim('If the link errors at first, wait 10-20 seconds and reload.'),
        bold('Bấm Ctrl+C để dừng. / Press Ctrl+C to stop.'),
      ])
    }
    const onData = (d) => {
      log.write(d)
      text += d
      if (!url) {
        const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
        if (m) {
          url = m[0]
          say('Đã có link, đang chờ kết nối xong...', 'Got the link; waiting for the connection...')
          setTimeout(announce, 15_000)
        }
      }
      if (url && /Registered tunnel connection/i.test(text)) announce()
    }
    t.stdout.on('data', onData)
    t.stderr.on('data', onData)
    await new Promise((resolve) => t.on('close', resolve))
    // cloudflared only exits by itself when something went wrong.
    if (!process.exitCode)
      throw new FriendlyError('cloudflared đã dừng.', 'cloudflared stopped.', [
        `Nhật ký / Log: ${logFile}`,
        ...text.trim().split('\n').slice(-6).map((l) => dim(l)),
        'Kiểm tra mạng (một số mạng trường/công ty chặn đường hầm) rồi chạy lại. / Check your network (some school/office networks block tunnels) and retry.',
      ])
  } catch (e) {
    cleanup()
    fail(e)
  }
}

// --------------------------------------------------------------- login ----

export async function login() {
  try {
    checkNode()
    await ensureDeps()
    await ensureAuth({}, {})
  } catch (e) {
    fail(e)
  }
}
