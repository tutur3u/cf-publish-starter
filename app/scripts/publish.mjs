// Entry point for `npm run publish`. The Node version check runs before
// anything else so old Node versions get a friendly message, not a crash.
const major = Number(process.versions.node.split('.')[0])
if (major < 22) {
  console.error('\n✗ Node.js ' + process.versions.node + ' quá cũ, cần bản 22 trở lên. Tải bản LTS tại https://nodejs.org')
  console.error('  Node.js ' + process.versions.node + ' is too old; version 22+ is required. Get the LTS from https://nodejs.org\n')
  process.exit(1)
}
const kit = await import('./cf-kit.mjs')
await kit.publish(process.argv.slice(2))
