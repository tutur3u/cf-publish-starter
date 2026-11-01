// Run at the repo root by mistake? Point the student to the right folder.
console.log(`
  Hãy vào thư mục mẫu trước / Go into a starter folder first:

    cd static     (trang tĩnh, người mới / plain HTML, beginners)
    cd app        (TanStack Start)

  rồi chạy lại / then run again:  npm run ${process.env.npm_lifecycle_event || 'publish'}
`)
process.exitCode = 1
