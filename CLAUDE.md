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

## 当前阶段目标
1. Supabase 数据库（problems + test_cases + courses 表）
2. REST API（/api/v1/problems, /api/v1/submit）
3. 管理后台（题目增删改查）
4. .py 文件批量导入脚本

## 技术栈
- Next.js 16.1.6 + React 19（App Router）
- TypeScript 5（strict 模式）
- Tailwind CSS v4
- Supabase（@supabase/supabase-js + @supabase/ssr 已在依赖中）
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
ADMIN_SECRET=...          # 管理后台保护，Header: x-admin-secret
```

## 目录结构（计划，部分尚未创建）
```
app/api/v1/          → API Routes（VSCode 插件调用）
app/admin/           → 管理后台页面
lib/supabase/        → 数据库客户端（server.ts / client.ts）
lib/types/           → TypeScript 类型定义
scripts/             → .py 文件批量导入脚本
supabase/migrations/ → SQL 建表文件（在 Supabase Dashboard 执行）
```

## Supabase 客户端使用模式
- **Server Components / API Routes**：使用 `@supabase/ssr` 的 `createServerClient`
- **Client Components**：使用 `@supabase/ssr` 的 `createBrowserClient`
- 客户端文件放在 `lib/supabase/server.ts` 和 `lib/supabase/client.ts`

## 技术约束
- API 必须用 `/api/v1/` 前缀（VSCode 插件已按此调用，**不能改**）
- 统一响应格式：`{ data: T, error: string | null }`
- `solution_code` **绝对不能**出现在任何 API 响应里（包括 SELECT * 查询）
- `problems` 表用 `course_id` 外键（不写死课程名）
- `user_progress` 表预留 `user_id` 字段（阶段二加登录时无缝迁移）
- 管理后台用 `ADMIN_SECRET` 环境变量保护（不做复杂 auth）
- API Route 必须 try/catch，错误返回 `{ data: null, error: message }`
- TypeScript strict 模式，零 `any`
- Server Components 优先，Client Components 加 `'use client'`

## VSCode 插件 API 契约
插件调用的端点（不可破坏性变更）：
- `GET /api/v1/problems` — 返回题目列表（不含 solution_code）
- `GET /api/v1/problems/[slug]` — 返回单题详情（不含 solution_code）
- `POST /api/v1/submit` — 提交代码评测
