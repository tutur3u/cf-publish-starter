# Đăng trang web lên mạng với Cloudflare: siêu đơn giản

[English version → README.en.md](README.en.md)

Bộ mẫu này giúp bạn đưa trang web lên mạng **miễn phí** bằng Cloudflare, chỉ với **một lệnh**:

```
npm run publish
```

Kết quả: một đường link như `https://ten-cua-ban.pages.dev` để gửi cho bất kỳ ai.

Có 2 mẫu (starter), chọn 1:

| Thư mục | Dành cho | Đường link nhận được |
| --- | --- | --- |
| [`static/`](static/) | **Người mới bắt đầu.** HTML + CSS + một chút JavaScript. Không cần build. | `https://<tên>.pages.dev` (Cloudflare Pages) |
| [`app/`](app/) | Đã quen React. TanStack Start + Vite, có code chạy trên máy chủ. | `https://<tên>.<tài-khoản>.workers.dev` (Cloudflare Workers) |

---

## Chọn cách nào?

| Cách | Cần gì | Link | Khi nào dùng |
| --- | --- | --- | --- |
| **A. Kéo-thả trên web** | Tài khoản Cloudflare (miễn phí). **Không cần dòng lệnh.** | Vĩnh viễn | Trang tĩnh (`static/`), không muốn cài gì |
| **B. `npm run publish`** | Tài khoản Cloudflare + Node.js | Vĩnh viễn | Cách chính. Một lệnh là xong |
| **C. `npm run share`** | Chỉ Node.js. **Không cần tài khoản.** | Tạm thời | Khoe nhanh bài đang làm. Gập máy là link chết |

---

## Chuẩn bị (làm 1 lần)

1. **Tải bộ mẫu về máy.** Trên trang GitHub của repo, bấm nút xanh **Code** → **Download ZIP**. Giải nén (Windows: chuột phải → *Extract All*; macOS: bấm đúp vào file .zip). Bạn sẽ có thư mục `cf-publish-starter-main`, bên trong có `static` và `app`.
2. **Tạo tài khoản Cloudflare miễn phí** (cho cách A và B): vào <https://dash.cloudflare.com/sign-up>, đăng ký bằng email. (Cách B cũng cho bạn đăng ký ngay lúc đăng nhập.)
3. **Cài Node.js** (cho cách B và C): vào <https://nodejs.org>, tải bản **LTS**, cài như phần mềm bình thường (cứ bấm *Next*). Cần bản **22 trở lên**.
   Kiểm tra: mở cửa sổ dòng lệnh (xem bên dưới), gõ `node -v`, nhấn Enter. Thấy `v22...` hoặc số lớn hơn là được.

### Mở cửa sổ dòng lệnh ngay trong thư mục mẫu

- **Windows:** mở thư mục bạn sẽ dùng (`static` cho HTML, `app` cho mẫu React/TanStack) trong File Explorer → bấm vào **thanh địa chỉ** ở trên cùng → xoá hết, gõ `cmd` → nhấn **Enter**. Một cửa sổ đen hiện ra, đã ở đúng thư mục.
- **macOS:** mở ứng dụng **Terminal** → gõ `cd ` (có dấu cách) → **kéo thư mục bạn sẽ dùng** (`static` cho HTML, `app` cho mẫu React/TanStack) từ Finder thả vào cửa sổ Terminal → nhấn **Enter**.

> Không muốn gõ lệnh? Trong mỗi thư mục mẫu có file bấm đúp: **`Publish-Windows.cmd`** / **`Share-Windows.cmd`** (Windows) và **`Publish-Mac.command`** / **`Share-Mac.command`** (macOS; lần đầu: chuột phải → *Open* → *Open*).

---

## Cách A: Kéo-thả trên web (không cần dòng lệnh)

Chỉ dùng cho mẫu `static/` (trang tĩnh).

1. Sửa trang web của bạn trong thư mục **`static/site/`** (file `index.html`, `style.css`, `script.js`).
2. Đăng nhập <https://dash.cloudflare.com>.
3. Ở menu bên trái, chọn **Workers & Pages**.
4. Bấm **Create application** → **Get started** → **Drag and drop your files**.
5. Gõ **tên dự án** (chữ thường, số, dấu gạch ngang; ví dụ `bai-tap-cua-an`). Tên này thành đường link: `bai-tap-cua-an.pages.dev`.
6. **Kéo thư mục `site`** (hoặc file .zip của nó) thả vào khung tải lên.
7. Bấm **Deploy site**. Tải xong thì bấm **Save and Deploy**, rồi mở dự án.
8. Trang của bạn đã lên mạng tại `https://<tên-dự-án>.pages.dev`. Gửi link này cho mọi người.

**Cập nhật lần sau:** mở dự án → **Create a new deployment** → chọn **Production** → kéo thư mục `site` mới vào.

Lưu ý: `index.html` phải nằm **ngay trong** thư mục bạn kéo (không nằm trong thư mục con khác). Giới hạn kéo-thả: tối đa 1.000 file, mỗi file dưới 25 MiB. Tên menu trên Cloudflare có thể đổi chút ít; nếu khác, tìm mục tải file trực tiếp (*Direct Upload*).

---

## Cách B: `npm run publish` (cách chính)

1. Mở cửa sổ dòng lệnh **trong thư mục `static`** (hoặc `app`), như hướng dẫn ở trên.
2. Gõ lệnh sau rồi nhấn **Enter**:
   ```
   npm run publish
   ```
3. Lần đầu, công cụ sẽ tự làm lần lượt:
   1. Kiểm tra Node.js.
   2. Cài các gói cần thiết (vài giây đến 2 phút, chỉ lần đầu). Các dòng `npm warn` / `npm notice` không phải lỗi, cứ bỏ qua.
   3. Build (chỉ với `app/`).
   4. **Hỏi tên trang web khi chạy trong cửa sổ dòng lệnh tương tác (TTY).** Nhấn Enter để dùng tên gợi ý, hoặc gõ tên bạn thích (có dấu tiếng Việt cũng được, công cụ tự đổi `Bài tập 1` thành `bai-tap-1`).
   5. **Mở trình duyệt để đăng nhập Cloudflare.** Đăng nhập (hoặc tạo tài khoản), rồi bấm **Allow**. Cửa sổ dòng lệnh in `Opening a link in your default browser: https://…` và trông như đứng yên khi chờ bạn. Bình thường nhé: làm xong trong trình duyệt và bấm **Allow**, rồi quay lại cửa sổ dòng lệnh.
   6. Tạo dự án và tải trang web lên.
4. Khi xong, bạn sẽ thấy một khung lớn:
   ```
   ============================================
      XONG! Trang web của bạn đã lên mạng / DONE! Your site is live:
      >>>  https://ten-cua-ban.pages.dev  <<<
   ============================================
   ```
5. Mở link đó (lần đầu có thể mất khoảng 1 phút). Gửi cho bạn bè, thầy cô.

**Sửa xong muốn cập nhật?** Chạy lại `npm run publish`. Lần sau không hỏi tên, không cần đăng nhập lại.

**Chọn tên của bạn:** `npm run publish -- --name ten-cua-ban`. Mặc định lấy tên thư mục; với `static`, `app` hoặc tên chứa `cf-publish-starter` (như bản ZIP), dùng `my-site` / `my-app`. Không có TTY hoặc có `--yes` thì dùng tên gợi ý, không hỏi. Tên đã lưu được dùng lại.

> Nếu tên đã có người dùng, Cloudflare tự thêm vài ký tự vào link. Công cụ luôn in ra **link thật**, cứ dùng link đó.

### Mẫu `app/` (TanStack Start)

Giống hệt: vào thư mục `app`, chạy `npm run publish`. Khác biệt:

- Ứng dụng chạy trên **Cloudflare Workers** (vì có code chạy trên máy chủ), link có dạng `https://<tên>.<tài-khoản>.workers.dev`.
- Lần đầu dùng Workers, Cloudflare có thể hỏi **"Would you like to register a workers.dev subdomain now?"** → gõ `y`, Enter, rồi đặt một tên cho tài khoản (ví dụ tên của bạn).
- Chạy thử trên máy: `npm run dev`, mở <http://localhost:3000>.

---

## Cách C: `npm run share` (link tạm thời, không cần tài khoản)

Dùng để khoe nhanh bài **đang làm** từ chính máy bạn.

1. Mở cửa sổ dòng lệnh trong thư mục `static` (hoặc `app`).
2. Gõ:
   ```
   npm run share
   ```
   Lần đầu tự cài các gói (vài giây đến 2 phút). Các dòng `npm warn` / `npm notice` không phải lỗi, cứ bỏ qua.
3. Nếu thấy `✓ cloudflared` thì máy đã có, bỏ qua bước này. Nếu máy chưa có **cloudflared**, công cụ hỏi có tải bản chính thức từ GitHub không. Nhấn **Enter** (đồng ý). Hoặc tự cài:
   - macOS: `brew install cloudflared`
   - Windows: `winget install --id Cloudflare.cloudflared` (cài xong mở lại cửa sổ dòng lệnh)
4. Chờ khoảng **5–20 giây** (mẫu `app/` còn cần thời gian build). Link nằm giữa `>>>` và `<<<` trong khung bên dưới. Copy link đó gửi cho người khác.

   ```
   ============================================

      Link tạm thời của bạn / Your temporary link:

      >>>  https://abc-xyz.trycloudflare.com  <<<

      Link này CHỈ chạy khi máy bạn đang mở và cửa sổ này còn chạy.
      It works ONLY while this computer is awake and this window stays open.
      Gập máy, máy ngủ, mất mạng hoặc bấm Ctrl+C = link chết.
      Closing the lid, sleep, losing Wi-Fi or pressing Ctrl+C kills the link.
      Mỗi lần chạy lại sẽ ra link MỚI. Ai có link đều xem được.
      Each run gives a NEW link. Anyone with the link can open it.
      Cần link lâu dài? Dùng: npm run publish
      Need a permanent link? Use: npm run publish

   ============================================
   ```
5. Bấm **Ctrl+C trong chính cửa sổ này** để dừng; không đóng các tab khác.

**Quan trọng:**

- Link **chỉ chạy khi máy bạn đang mở và cửa sổ dòng lệnh còn chạy**. Gập máy, máy ngủ, mất Wi-Fi, hoặc bấm Ctrl+C là **link chết**.
- **Mỗi lần chạy ra link mới.** Ai có link đều xem được.
- Chỉ để thử/khoe tạm. Cần link lâu dài thì dùng **Cách B**.
- Theo Cloudflare: không cam kết thời gian hoạt động; tối đa 200 yêu cầu cùng lúc (quá thì báo lỗi 429); không hỗ trợ Server-Sent Events.

---

## Nhờ AI làm giúp (Claude Code, Codex...)

Mở thư mục mẫu bằng Claude Code hoặc Codex và nói: **"Đăng trang này lên mạng giúp mình"** (hoặc *"publish this"*). File [`AGENTS.md`](AGENTS.md) và [`.claude/skills/publish-site/SKILL.md`](.claude/skills/publish-site/SKILL.md) hướng dẫn AI chạy đúng các lệnh trên. Khi trình duyệt mở trang Cloudflare, **bạn** bấm *Allow*. Đừng bao giờ dán mật khẩu hay token vào khung chat.

> `.claude` là thư mục ẩn; bật hiển thị file ẩn nếu chưa thấy nó.

---

## Sửa lỗi thường gặp

1. **`'npm' is not recognized...` / `command not found: npm`**
   Chưa cài Node.js, hoặc cài xong chưa mở lại cửa sổ dòng lệnh. Cài bản LTS ở <https://nodejs.org>, **đóng và mở lại** cửa sổ dòng lệnh, thử `node -v`.

2. **Windows PowerShell báo `npm.ps1 cannot be loaded because running scripts is disabled`**
   Dùng **Command Prompt** (gõ `cmd` vào thanh địa chỉ như hướng dẫn trên) thay vì PowerShell, hoặc bấm đúp `Publish-Windows.cmd`. Hoặc chạy một lần trong PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` rồi chọn `Y`.

3. **`Node.js ... quá cũ, cần bản 22 trở lên`**
   Cài bản LTS mới ở <https://nodejs.org>, đóng/mở lại cửa sổ dòng lệnh.

4. **Đăng nhập không xong** (trình duyệt không mở, hoặc lệnh đứng chờ mãi)
   Trong cửa sổ dòng lệnh, tìm dòng `Opening a link in your default browser:`, copy đường link phía sau, dán vào trình duyệt **trên cùng máy**, bấm **Allow**. Nếu lỡ đóng: bấm Ctrl+C, chạy lại `npm run publish`. Có thể đăng nhập riêng bằng `npm run login`.

5. **Trang trắng hoặc 404 sau khi đăng**
   `index.html` phải nằm **ngay trong** `static/site/` (với cách A: ngay trong thư mục bạn kéo thả). Tên file viết thường: `index.html`, không phải `Index.HTML`. Ảnh: kiểm tra tên file và chữ hoa/thường khớp với code.

6. **Link `trycloudflare.com` không mở được**
   Đợi 10-20 giây rồi tải lại. Kiểm tra máy còn mở và cửa sổ `npm run share` còn chạy. Một số mạng trường/công ty chặn đường hầm: thử Wi-Fi khác hoặc 4G.

7. **`Bạn có nhiều tài khoản Cloudflare. Chọn một`**
   Gõ số của tài khoản muốn dùng. Công cụ ghi nhớ cho lần sau.

8. **`npm publish` (thiếu chữ `run`)**
   Luôn gõ `npm run publish`. Lệnh `npm publish` là lệnh khác của npm; bộ mẫu đã chặn nó (`"private": true`) nên không có gì xảy ra.

---

## Kiểm tra lại (trên máy mới)

Trên một máy **mới** (chưa từng dùng Cloudflare/wrangler), làm theo thứ tự. Mỗi bước có kết quả mong đợi.

| # | Làm | Kết quả mong đợi |
| --- | --- | --- |
| 1 | Cài Node LTS, mở cửa sổ dòng lệnh, `node -v` | `v22.x` trở lên |
| 2 | Tải ZIP, giải nén, vào `static`, chạy `npm run check` | Các dấu ✓, cuối cùng: `Kiểm tra xong. Mọi thứ trước bước đăng nhập/deploy đều ổn.` và dòng `→ Chưa đăng nhập Cloudflare...` |
| 3 | `npm run publish`, nhấn Enter ở câu hỏi tên, đăng nhập, bấm Allow | Khung `XONG!` với link `https://<tên>.pages.dev` |
| 4 | Mở link trên **điện thoại dùng 4G** | Thấy trang "Xin chào! 👋", nút "Bấm tôi" đếm được |
| 5 | Sửa chữ trong `site/index.html`, chạy lại `npm run publish` | Không hỏi tên/đăng nhập nữa; tải lại link thấy chữ mới |
| 6 | `npm run share` | Khung với link `https://....trycloudflare.com`; mở trên điện thoại được |
| 7 | Bấm Ctrl+C (hoặc gập máy), tải lại link trên điện thoại | Link báo lỗi (Cloudflare 530/1033): đúng như mong đợi |
| 8 | Vào `app`, `npm run publish` | Build xong, (có thể hỏi workers.dev subdomain), khung `XONG!` với link `...workers.dev`; trang ghi "Chạy trên: Cloudflare-Workers" |
| 9 | Cách A: kéo thư mục `static/site` lên dashboard theo các bước ở trên | Link `https://<tên>.pages.dev` mở được |

Dọn dẹp sau khi thử: dashboard → **Workers & Pages** → chọn dự án → **Settings** → xoá dự án.

---

## Cho người dạy: dùng API token thay cho đăng nhập (tuỳ chọn)

Trên máy chủ CI hoặc máy dùng chung, đặt hai biến môi trường thay vì đăng nhập bằng trình duyệt:

- `CLOUDFLARE_API_TOKEN`: tạo ở dashboard → **API Tokens** → **Create Token** → **Custom Token** → quyền *Account / Cloudflare Pages / Edit* (thêm *Workers Scripts / Edit* nếu đăng `app/`).
- `CLOUDFLARE_ACCOUNT_ID`: mã tài khoản Cloudflare.

Khi có hai biến này, `npm run publish` bỏ qua bước đăng nhập. Xem chi tiết trong [README.en.md](README.en.md#for-teachers-api-token-instead-of-browser-login).

---

## Nguồn (tài liệu Cloudflare, kiểm tra ngày 1/11/2026)

- Pages Direct Upload (Wrangler và kéo-thả): <https://developers.cloudflare.com/pages/get-started/direct-upload/>
- Lệnh `wrangler pages`: <https://developers.cloudflare.com/workers/wrangler/commands/pages/>
- Direct Upload với CI (API token): <https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/>
- TanStack Start trên Cloudflare: <https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/>
- Quick Tunnels: <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/>

Các mẹo như "`index.html` phải nằm ngay trong thư mục" và mục sửa lỗi là kinh nghiệm thực tế, không trích từ tài liệu.

Giấy phép: [MIT](LICENSE).
