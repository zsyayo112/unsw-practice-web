# UNSW Practice Web Backend

后端 API 服务 + 管理后台，为 UNSW Practice VSCode 插件提供数据支持。

Backend API service and admin dashboard that powers the UNSW Practice VSCode extension.

---

## 技术栈 / Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript 5** (strict mode)
- **Supabase** — PostgreSQL database + auth
- **Judge0 CE** — code execution and evaluation
- **Tailwind CSS v4**
- **Vercel** — deployment

---

## 本地开发 / Local Development

```bash
git clone <repo-url>
cd unsw-practice-web
npm install
cp .env.local.example .env.local
# Fill in Supabase and other env vars
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
```

---

## 环境变量 / Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `ADMIN_SECRET` | Admin dashboard password |

---

## API 文档 / API Reference

All public endpoints use prefix `/api/v1/`. Response format is always `{ data: T, error: string | null }`.

### GET /api/v1/problems

Returns list of published problems (never includes `solution_code`).

Query parameters:
- `?course=COMP9021` — filter by course code
- `?difficulty=easy` — filter by difficulty (`easy` / `medium` / `hard`)

### GET /api/v1/problems/:slug

Returns a single problem by slug. Returns 404 if not found or unpublished.

### POST /api/v1/submit

Submit code for evaluation via Judge0.

Request body:
```json
{
  "problemId": "uuid",
  "code": "def fibonacci(n):\n    ...",
  "language": "python"
}
```

Response:
```json
{
  "data": {
    "status": "accepted",
    "testResults": [{ "passed": true, "input": "...", "expectedOutput": "...", "actualOutput": "..." }],
    "runtimeMs": 42,
    "message": "3 / 3 Tests Passed"
  },
  "error": null
}
```

Status values: `accepted` | `wrong_answer` | `runtime_error` | `time_limit_exceeded`

### GET /api/v1/health

Database connectivity check.

### GET /api/v1/progress

Phase 2 stub — returns empty array.

---

## 管理后台 / Admin Dashboard

Visit `/admin` and enter the `ADMIN_SECRET` password.

Features: create / edit / delete problems, publish / unpublish, manage test cases.

Admin API endpoints (require header `x-admin-secret: <secret>`):

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/problems` | List all problems |
| POST | `/api/admin/problems` | Create problem |
| GET | `/api/admin/problems/:id` | Get problem |
| PUT | `/api/admin/problems/:id` | Update problem |
| DELETE | `/api/admin/problems/:id` | Delete problem |
| POST | `/api/admin/problems/:id/publish` | Publish |
| POST | `/api/admin/problems/:id/unpublish` | Unpublish |

---

## 添加新题目规范 / Test Case Format

Test case `input` must be **complete, executable Python code**. The submit endpoint appends it directly to the student's code and runs it.

**Function problems:**
```
print(fibonacci(6))
```
Expected output: `8`

**Class problems:**
```
s = Stack()
s.push(1)
s.push(2)
print(s.peek())
```
Expected output: `2`

Hidden test cases (check "Hidden") are invisible to students but still evaluated on submit — use them to prevent hard-coded answers.

---

## 批量导入 / Bulk Import

```bash
# Preview only (no DB writes)
python scripts/import_problems.py --dir ./py_files --course COMP9021 --dry-run

# Single file preview
python scripts/import_problems.py --file fibonacci.py --dry-run

# Import to database
python scripts/import_problems.py --dir ./py_files --course COMP9021 --import
```

Requirements: `pip install supabase python-dotenv`. Problem files must use function name `f` and doctest format for test cases.

---

## 部署 / Deployment

Deploy to Vercel with one click. Set all environment variables in the Vercel project settings.

Database schema: run `supabase/migrations/001_initial_schema.sql` in the Supabase Dashboard SQL Editor.
