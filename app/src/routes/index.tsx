import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

// This function runs on the server (Cloudflare Workers once published,
// your own computer during `npm run dev`). The page calls it before rendering.
const getServerInfo = createServerFn({ method: 'GET' }).handler(async () => ({
  time: new Date().toISOString(),
  runtime: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
}))

export const Route = createFileRoute('/')({
  loader: () => getServerInfo(),
  component: Home,
})

function Home() {
  const info = Route.useLoaderData()
  const [count, setCount] = useState(0)
  return (
    <main>
      <div className="bar" />
      <h1>Xin chào! 👋</h1>
      <p className="lead">
        Đây là ứng dụng TanStack Start. Sửa file <code>src/routes/index.tsx</code>, rồi chạy{' '}
        <code>npm run publish</code>.
      </p>

      <section className="card">
        <h2>Máy chủ trả lời</h2>
        <p>
          Giờ máy chủ: <strong>{info.time}</strong>
          <br />
          Chạy trên: <strong>{info.runtime}</strong>
        </p>
      </section>

      <section className="card">
        <h2>Thử React</h2>
        <p>
          Bạn đã bấm nút <strong>{count}</strong> lần.
        </p>
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          Bấm tôi
        </button>
      </section>

      <footer>TanStack Start · Cloudflare Workers</footer>
    </main>
  )
}
