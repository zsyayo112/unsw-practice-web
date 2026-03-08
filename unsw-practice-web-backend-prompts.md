# UNSW Practice Web 后端 — Claude Code Prompt 套件
# 在 unsw-practice-web 项目目录里执行

---

## 准备工作

```bash
# 1. 创建项目
cd ~/projects
npx create-next-app@latest unsw-practice-web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# 2. 进入项目
cd unsw-practice-web

# 3. 安装依赖
npm install @supabase/supabase-js @supabase/ssr

# 4. 启动 Claude Code
claude
```

---

## PROMPT 0 — 建立 CLAUDE.md

第一件事，进入 claude 后先发这条：

```
Create CLAUDE.md in the project root with this exact content:

# UNSW Practice Web Backend

## 项目背景
UNSW CS 学生学习平台的后端服务 + 管理后台。
配套 VSCode 插件：unsw-practice-vscode（Week 1-4 已完成 MVP）
商业目标：为 UNSW 补课机构引流，平台本身完全免费。

## 三阶段演进（影响每个技术决策）
阶段一（当前）：后端 API + 管理后台 + 题库入库
阶段二（3-6个月）：用户注册登录 + 网页版练题 + 进度云同步
阶段三（6-12个月）：多课程 Wiki + 课程评价 + 学习社区

## 当前阶段目标
1. Supabase 数据库（problems + test_cases + courses 表）
2. REST API（/api/v1/problems, /api/v1/submit）
3. 管理后台（题目增删改查）
4. .py 文件批量导入脚本

## 技术约束
- API 必须用 /api/v1/ 前缀（插件已按此调用，不能改）
- 统一响应格式：{ data: T, error: string | null }
- solution_code 绝对不能出现在 API 响应里
- problems 表用 course_id 外键（不写死课程名，支持未来多课程）
- user_progress 表预留 user_id 字段（阶段二加登录时无缝迁移）
- 管理后台用 ADMIN_SECRET 环境变量保护（不做复杂 auth）

## 目录结构
app/api/v1/          → API Routes
app/admin/           → 管理后台页面
lib/supabase/        → 数据库客户端
lib/types/           → TypeScript 类型
scripts/             → .py 文件导入脚本
supabase/migrations/ → SQL 建表文件

## 构建命令
- npm run dev    → localhost:3000
- npm run build  → 生产构建
- npm run lint   → ESLint 检查

## 代码规范
- TypeScript strict 模式，零 any
- API Route 必须 try/catch，错误返回 { data: null, error: message }
- 不在任何 API 响应里包含 solution_code 字段
- Server Components 优先，Client Components 加 'use client'
```

Then run /init to scan the project.
```

---

## PROMPT 1 — 数据库 Schema

`/clear` 后执行：

```
## 当前任务：数据库 Schema 设计

创建文件 supabase/migrations/001_initial_schema.sql
这个文件直接在 Supabase Dashboard 的 SQL Editor 里执行。

要求生成完整可执行的 SQL，包含：

-- 1. COURSES 表
CREATE TABLE courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 2. PROBLEMS 表
CREATE TABLE problems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid REFERENCES courses(id),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  difficulty      text CHECK (difficulty IN ('easy','medium','hard')),
  topics          text[] DEFAULT '{}',
  description     text NOT NULL,
  starter_code    text NOT NULL,
  solution_code   text,
  hints           text[] DEFAULT '{}',
  order_index     integer DEFAULT 0,
  acceptance_rate numeric DEFAULT 0,
  is_published    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 3. TEST_CASES 表
CREATE TABLE test_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      uuid REFERENCES problems(id) ON DELETE CASCADE,
  input           text NOT NULL,
  expected_output text NOT NULL,
  is_hidden       boolean DEFAULT false,
  order_index     integer DEFAULT 0
);

-- 4. USER_PROGRESS 表（阶段二启用，现在建好结构）
CREATE TABLE user_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid,
  problem_id        uuid REFERENCES problems(id),
  status            text CHECK (status IN ('attempted','solved')),
  solve_count       integer DEFAULT 0,
  last_submitted_at timestamptz,
  UNIQUE(user_id, problem_id)
);

还需要包含：
- updated_at 自动触发器（problems 表）
- 索引：problems(course_id), problems(slug), problems(is_published),
        test_cases(problem_id), test_cases(order_index)
- RLS：暂时全部 disable（阶段二加用户系统时再开启）

种子数据（seed data）：
- 插入 COMP9021 课程记录
- 插入 3 道示例题目（fibonacci / stack-implementation / bank-account）
  每道题至少 3 个 test_cases
  is_published = true

生成完整 SQL 后，在文件顶部注释说明执行顺序。
```

---

## PROMPT 2 — Supabase 客户端配置

`/clear` 后执行：

```
## 当前任务：Supabase 客户端配置

创建以下文件：

1. lib/supabase/server.ts
使用 @supabase/ssr 创建服务端客户端（用于 API Routes 和 Server Components）：

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  )
}

export function createAdminClient() {
  // 使用 service_role key，绕过 RLS
  // 只在管理后台 API 里使用
}

2. lib/supabase/client.ts
客户端 Supabase 实例（给 Client Components 用）

3. lib/types/database.ts
根据 Schema 生成完整的 Database 类型定义：
- Tables 类型（Row / Insert / Update for each table）
- 所有字段类型精确匹配 SQL Schema

4. .env.local.example
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JUDGE0_API_URL=https://ce.judge0.com
ADMIN_SECRET=your-admin-password-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000

5. 验证配置正确：
在 app/api/v1/health/route.ts 创建健康检查接口：
GET /api/v1/health → { data: { status: 'ok', db: 'connected' }, error: null }
实际查询 Supabase courses 表验证连接

After creating:
npm run build — should pass with zero errors
```

---

## PROMPT 3 — API Routes

`/clear` 后执行：

```
## 当前任务：API Routes 实现

实现所有 API 接口，统一响应格式 { data, error }。
solution_code 绝对不能出现在任何响应里。

--- 1. GET /api/v1/problems ---
文件：app/api/v1/problems/route.ts

查询 problems 表 JOIN test_cases
条件：is_published = true
支持查询参数：
  ?course=COMP9021  按课程代码筛选
  ?difficulty=easy  按难度筛选

响应字段（camelCase）：
id, slug, title, difficulty, topics, description,
starterCode, hints, orderIndex, acceptanceRate, courseId,
testCases: [{ id, input, expectedOutput, isHidden, orderIndex }]

注意：
- 不返回 solution_code
- 不返回 is_hidden=true 的 test_cases（只返回公开用例）
- 按 order_index ASC 排序

--- 2. GET /api/v1/problems/:slug ---
文件：app/api/v1/problems/[slug]/route.ts

和上面一样，但通过 slug 查单题
404 时返回 { data: null, error: 'Problem not found' }

--- 3. POST /api/v1/submit ---
文件：app/api/v1/submit/route.ts

请求体：{ problemId: string, code: string, language: 'python' }

流程：
1. 从数据库查 problem 的所有 test_cases（包括 hidden）
2. 对每个 test_case 调 Judge0 CE 执行代码
3. 汇总结果返回

Judge0 CE 调用方式（和插件一样）：
POST https://ce.judge0.com/submissions?base64_encoded=false&wait=true
{
  "source_code": user_code + "\n" + test_case.input,
  "language_id": 71,
  "expected_output": test_case.expected_output,
  "cpu_time_limit": 3
}

并发：Promise.allSettled，最多 3 个并发
超时：每个请求 10s AbortController

响应格式：
{
  "data": {
    "status": "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded",
    "testResults": [
      {
        "passed": boolean,
        "input": string,
        "expectedOutput": string,
        "actualOutput": string,
        "error": string | null
      }
    ],
    "runtimeMs": number,
    "message": "3 / 3 Tests Passed"
  },
  "error": null
}

--- 4. GET /api/v1/progress ---
文件：app/api/v1/progress/route.ts

阶段一：返回空数组（用户系统阶段二才做）
{ data: [], error: null }
加注释说明阶段二如何实现

After implementing all routes:
1. npm run build — zero errors
2. Test each route with curl:
   curl http://localhost:3000/api/v1/problems
   curl http://localhost:3000/api/v1/problems/fibonacci
   curl http://localhost:3000/api/v1/health
3. Show me the curl output for /api/v1/problems
```

---

## PROMPT 4 — 管理后台

`/clear` 后执行：

```
## 当前任务：管理后台页面

实现简单但好用的题目管理后台。
保护方式：请求头 x-admin-secret 必须等于环境变量 ADMIN_SECRET。

--- 布局 ---
文件：app/admin/layout.tsx

简单的侧边栏布局：
- 左侧导航：Dashboard | Problems | + New Problem
- 顶部显示：UNSW Practice Admin
- 用 Tailwind CSS，不需要安装额外 UI 库

--- 首页 ---
文件：app/admin/page.tsx

显示统计数据：
- 题目总数 / 已发布 / 草稿
- 各难度分布（Easy X / Medium Y / Hard Z）
- 最近 5 条题目（标题 + 发布状态）

--- 题目列表 ---
文件：app/admin/problems/page.tsx

表格显示所有题目（包括草稿）：
- 列：# | 标题 | 难度 | Topics | 测试用例数 | 状态 | 操作
- 状态 badge：已发布（绿）/ 草稿（灰）
- 操作：编辑按钮（跳转 /admin/problems/[id]）
- 顶部：+ 新增题目 按钮

--- 新增/编辑题目 ---
文件：
  app/admin/problems/new/page.tsx
  app/admin/problems/[id]/page.tsx

表单字段：
- 标题（text input）
- Slug（text input，从标题自动生成，可手动修改）
- 难度（select：easy/medium/hard）
- Topics（text input，逗号分隔）
- 课程（select，从 courses 表读取）
- 题目描述（textarea，Markdown）
- 初始代码（textarea，Python）
- 解答代码（textarea，Python，仅后台可见）
- Hints（动态列表：添加/删除每条 hint）
- 测试用例（动态列表）：
    每行：Input | Expected Output | Hidden? | 删除
    + 添加测试用例 按钮
- 底部按钮：[保存草稿] [发布上线] [删除题目（编辑页才有）]

API Routes for admin（加 admin 鉴权）：
  POST   /api/admin/problems         新增题目
  PUT    /api/admin/problems/[id]    更新题目
  DELETE /api/admin/problems/[id]    删除题目
  POST   /api/admin/problems/[id]/publish    发布
  POST   /api/admin/problems/[id]/unpublish  下架

鉴权中间件：
所有 /api/admin/* 路由检查 request.headers.get('x-admin-secret')
不匹配返回 401

After implementing:
1. npm run build
2. npm run dev
3. 打开 http://localhost:3000/admin
4. 截图告诉我页面是否正常显示
```

---

## PROMPT 5 — .py 文件导入脚本

`/clear` 后执行：

```
## 当前任务：.py 文件批量导入脚本

创建 scripts/import_problems.py

这个脚本解析 COMP9021 的 .py 题目文件，批量导入到 Supabase。

题目文件的格式特征：
1. 函数名统一是 f（单字母）
2. 测试用例是 doctest 格式：
   >>> f(0)
   0
   >>> f(1, 2)
   3
3. 多行输出紧跟在 >>> 调用后面
4. 有些文件顶部有注释如 # 纯回忆题
5. if __name__ == "__main__": import doctest; doctest.testmod()

脚本功能：

1. parse_file(filepath) → dict
   从单个 .py 文件提取：
   - slug: 文件名去掉 .py，空格转 -，小写
   - starter_code: 函数签名 + docstring + pass（去掉函数体）
   - solution_code: 原始函数实现
   - test_cases: 从 doctest 提取 [{ input, expected_output }]
     input 格式：print(f(...))  ← 包装成 print 调用
     expected_output：>>> 后面的输出行（支持多行）
   - topics: 从注释和函数内容推断
     含 recursion/recursive → ['recursion']
     含 class → ['oop']
     含 sort → ['sorting']
     含 open/file → ['file-io']
     其他 → ['general']
   - difficulty: 启发式判断
     函数体 < 15 行 → easy
     15-40 行 → medium
     > 40 行 → hard

2. import_to_supabase(problems, course_code, dry_run)
   - dry_run=True：只打印解析结果，不写数据库
   - dry_run=False：插入 problems + test_cases 表
   - 跳过 slug 已存在的题目（不覆盖）
   - 打印进度：成功 X / 跳过 Y / 失败 Z

3. 命令行参数：
   python import_problems.py --dir ./py_files --course COMP9021 --dry-run
   python import_problems.py --dir ./py_files --course COMP9021 --import
   python import_problems.py --file single_file.py --dry-run

4. 依赖：
   pip install supabase python-dotenv
   从项目根目录的 .env.local 读取 Supabase 配置

5. 输出示例：
   解析 fibonacci.py...
   ✓ slug: fibonacci
   ✓ 测试用例: 3 个
   ✓ 难度推断: easy
   ✓ topics: ['recursion']
   ⚠ 描述为空，需要手动在管理后台补充

   完成：解析 25 个文件
   导入成功: 23 / 跳过(已存在): 2 / 失败: 0

在脚本底部加使用说明注释。
```

---

## PROMPT 6 — 插件联调

`/clear` 后执行（在插件项目 unsw-practice-vscode 里）：

```
## 当前任务：插件切换到真实后端 API

后端已部署到 Vercel，现在把插件的 MOCK_MODE 关掉，
接入真实 API。

修改 @src/services/api.ts：

1. 将 MOCK_MODE 从 true 改为 false

2. 确认 API base URL 读取逻辑正确：
   const baseUrl = vscode.workspace
     .getConfiguration('unsw-practice')
     .get<string>('apiBaseUrl', 'https://你的vercel域名.vercel.app')

3. 确认所有接口路径用 /api/v1/ 前缀：
   GET  ${baseUrl}/api/v1/problems
   GET  ${baseUrl}/api/v1/problems/${slug}
   POST ${baseUrl}/api/v1/submit

4. 响应字段映射检查：
   后端返回 snake_case 还是 camelCase？
   插件 types/index.ts 用的是 camelCase
   如果后端返回 snake_case，在 api.ts 里加转换函数

After changes:
1. npm run type-check
2. npm run build
3. F5 启动插件
4. 侧边栏应该显示从真实数据库加载的题目
5. Run 一道题，确认端到端流程：
   插件 → Vercel API → Supabase → Judge0 CE → 返回结果
6. 告诉我侧边栏显示的题目列表
```

---

## PROMPT 7 — 验证和部署

`/clear` 后执行（在后端项目里）：

```
## 当前任务：生产部署前验证

在部署到 Vercel 之前，做完整的验证：

1. 运行完整检查：
   npm run lint
   npm run build
   确认零错误零警告

2. 验证所有 API 接口（本地 npm run dev）：

   # 健康检查
   curl http://localhost:3000/api/v1/health

   # 题目列表
   curl http://localhost:3000/api/v1/problems

   # 单题
   curl http://localhost:3000/api/v1/problems/fibonacci

   # 提交代码
   curl -X POST http://localhost:3000/api/v1/submit \
     -H "Content-Type: application/json" \
     -d '{"problemId":"<uuid>","code":"def fib(n):\n  if n<=1: return n\n  return fib(n-1)+fib(n-2)","language":"python"}'

   确认：
   - problems 响应不含 solution_code 字段
   - submit 响应包含 testResults 数组
   - 所有响应格式是 { data, error }

3. 安全检查：
   - solution_code 没有出现在任何 GET 响应
   - /api/admin/* 没有 x-admin-secret 时返回 401
   - 环境变量没有硬编码在代码里

4. 生成 Vercel 部署配置 vercel.json（如需要）

5. 告诉我部署步骤：
   - 如何连接 GitHub 仓库到 Vercel
   - 需要配置哪些环境变量
   - 部署后如何验证
```

---

## 执行顺序总览

| 步骤 | Prompt | 预计时间 |
|------|--------|---------|
| 0 | 建立 CLAUDE.md + /init | 10 分钟 |
| 1 | 数据库 Schema + Supabase 执行 | 30 分钟 |
| 2 | Supabase 客户端配置 | 20 分钟 |
| 3 | API Routes 实现 | 45 分钟 |
| 4 | 管理后台页面 | 60 分钟 |
| 5 | .py 文件导入脚本 | 30 分钟 |
| 6 | 插件联调（回到插件项目）| 30 分钟 |
| 7 | 验证 + 部署 Vercel | 30 分钟 |

**总计：约 4-5 小时，分两天完成**

---

## 每个 Prompt 完成后必做

```bash
# 1. 验证
npm run build

# 2. 提交
git add .
git commit -m "Week 5: [描述做了什么]"
git push

# 3. 更新上下文
/init
/clear
```

---

## Supabase 操作步骤（第一次）

```
1. 打开 supabase.com → 登录 → New Project
2. 填写：
   Name: unsw-practice
   Password: [强密码，记下来]
   Region: Southeast Asia (Singapore)
3. 等待 2 分钟创建完成
4. 进入项目 → SQL Editor
5. 把 001_initial_schema.sql 内容粘贴进去执行
6. 进入 Settings → API，复制三个值到 .env.local：
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role → SUPABASE_SERVICE_ROLE_KEY（保密！）
```