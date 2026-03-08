# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# UNSW Practice Web Backend

## 项目背景
UNSW CS 学生学习平台的后端服务 + 管理后台。
配套 VSCode 插件：unsw-practice-vscode（Week 1-4 已完成 MVP）
商业目标：为 UNSW 补课机构引流，平台本身完全免费。

## 三阶段演进（影响每个技术决策）
- 阶段一（当前）：后端 API + 管理后台 + 题库入库
- 阶段二（3-6个月）：用户注册登录 + 网页版练题 + 进度云同步
- 阶段三（6-12个月）：多课程 Wiki + 课程评价 + 学习社区

## 技术栈
- Next.js 15 + React 19（App Router）
- TypeScript 5（strict 模式）
- Tailwind CSS v4
- Supabase（@supabase/supabase-js + @supabase/ssr）
- Judge0 API（代码评测，`https://ce.judge0.com`）
- 路径别名：`@/*` → 项目根目录

## 构建命令
```bash
npm run dev      # 开发服务器 localhost:3000
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # ESLint 检查（运行 eslint，非 next lint）
```

测试框架尚未配置（阶段一不做）。

## 环境变量
`.env.local` 需包含：
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # createAdminClient() 使用，绕过 RLS
ADMIN_SECRET=...                # 管理后台保护，Header: x-admin-secret
```

## 目录结构
```
app/api/v1/          → Public API Routes（VSCode 插件调用）
app/api/admin/       → Admin API Routes（受 ADMIN_SECRET 保护）
app/admin/           → 管理后台页面（Server Components + Client Forms）
lib/supabase/        → server.ts（createClient/createAdminClient）+ client.ts
lib/admin/auth.ts    → isAdminAuthenticated() + unauthorizedResponse() 工具函数
lib/types/           → database.ts（Supabase 生成类型）+ problem-row.ts
scripts/             → import_problems.py（.py 文件批量导入）
supabase/migrations/ → 001_initial_schema.sql（在 Supabase Dashboard 手动执行）
py_files/            → 样本 COMP9021 .py 题目文件（测试用）
```

## 数据库 Schema
四张表（见 `supabase/migrations/001_initial_schema.sql`）：
- `courses` — 课程元数据
- `problems` — 题目（含 `solution_code`、`is_published`、`topics[]`、`hints[]`）
- `test_cases` — 测试用例（含 `is_hidden`，隐藏用例不返回给用户）
- `user_progress` — 阶段二预留（`user_id` 字段为空时表示未登录）

## Supabase 客户端使用模式
- **Server Components / API Routes**：`lib/supabase/server.ts` 的 `createClient()`（基于 cookies）
- **需要 Service Role（绕过 RLS）**：`lib/supabase/server.ts` 的 `createAdminClient()`
- **Client Components**：`lib/supabase/client.ts` 的 `createClient()`（`createBrowserClient`）

## 核心类型与工具
- `lib/types/database.ts`：Supabase 自动生成的全部表类型（Row / Insert / Update）
- `lib/types/problem-row.ts`：`ProblemRow` 接口 + `mapProblemRow()` — 将 snake_case 转 camelCase，过滤隐藏测试用例
- `lib/admin/auth.ts`：`isAdminAuthenticated(request)` 检查 `x-admin-secret` header

## API 架构

### Public API（VSCode 插件调用，不可破坏性变更）
| 端点 | 说明 |
|------|------|
| `GET /api/v1/problems` | 返回已发布题目列表，支持 `?course=&difficulty=` 过滤 |
| `GET /api/v1/problems/[slug]` | 单题详情 |
| `POST /api/v1/submit` | 提交代码评测（Judge0，并发限制 3） |
| `GET /api/v1/health` | 数据库连通性检查 |
| `GET /api/v1/progress` | 阶段二 stub，返回空数组 |

### Admin API（Header: `x-admin-secret`）
| 端点 | 说明 |
|------|------|
| `GET/POST /api/admin/problems` | 列出全部题目 / 创建题目 |
| `GET/PUT/DELETE /api/admin/problems/[id]` | 读取/更新/删除单题 |
| `POST /api/admin/problems/[id]/publish` | 发布题目 |
| `POST /api/admin/problems/[id]/unpublish` | 取消发布 |

### Submit 端点（Judge0）
`POST /api/v1/submit` 接收 `{ slug, code }`，对所有测试用例并发评测（`p-limit` 限制并发为 3），返回每个测试用例的 `status`（`accepted` | `wrong_answer` | `runtime_error` | `time_limit_exceeded`）。

## 技术约束
- API 必须用 `/api/v1/` 前缀（VSCode 插件已按此调用，**不能改**）
- 统一响应格式：`{ data: T, error: string | null }`
- `solution_code` **绝对不能**出现在任何 Public API 响应里（包括 `SELECT *` 查询）
- `problems` 表用 `course_id` 外键（不写死课程名）
- `user_progress` 表预留 `user_id` 字段（阶段二加登录时无缝迁移）
- 管理后台用 `ADMIN_SECRET` 环境变量保护（不做复杂 auth）
- API Route 必须 try/catch，错误返回 `{ data: null, error: message }`
- TypeScript strict 模式，零 `any`
- Server Components 优先，Client Components 加 `'use client'`

## 管理后台架构
- `app/admin/AdminContext.tsx`：管理员 secret 存 `sessionStorage`，`useAdminSecret()` hook 全局访问
- `app/admin/AdminShell.tsx`：顶部 secret 输入条（未设置时显示）
- `app/admin/problems/ProblemForm.tsx`：创建/编辑题目的共用表单（含动态 hints 数组、动态测试用例网格）
- Admin 页面为 Server Components，数据在服务端 fetch；表单交互部分为 Client Components

## 批量导入脚本
```bash
# 预览（不写数据库）
python scripts/import_problems.py --dir ./py_files --course COMP9021 --dry-run

# 单文件预览
python scripts/import_problems.py --file fibonacci.py --dry-run

# 实际导入
python scripts/import_problems.py --dir ./py_files --course COMP9021 --import
```
依赖：`pip install supabase python-dotenv`。脚本从 `.env.local` 读取 Supabase 配置。
题目文件要求：函数名必须是 `f`，测试用例用 doctest 格式写在 docstring 里。
