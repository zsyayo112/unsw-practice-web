# 题目录入操作手册 / Problem Entry Guide

## 快速开始 / Quick Start

1. 打开管理后台 / Open the admin dashboard: `/admin`
2. 顶部输入管理员密码 / Enter the admin secret at the top
3. 点击 **+ New Problem** / Click **+ New Problem**

---

## 填写字段说明 / Field Reference

### 基本信息 / Basic Info

| 字段 | 说明 | Field | Description |
|---|---|---|---|
| 标题 | 题目名称 | Title | Problem name, e.g. "Fibonacci Sequence" |
| Slug | URL 标识符，小写+连字符（自动生成，可修改） | Slug | URL identifier, lowercase + hyphens, e.g. `fibonacci` (auto-generated) |
| 难度 | Easy / Medium / Hard | Difficulty | Easy / Medium / Hard |
| Topics | 逗号分隔，如 `recursion, dynamic-programming` | Topics | Comma-separated, e.g. `recursion, dynamic-programming` |
| 课程 | 从下拉菜单选择 | Course | Select from dropdown |

### 题目描述 / Problem Description

支持 Markdown 格式 / Supports standard Markdown.

推荐格式 / Recommended format:

```markdown
Implement a function `fib(n)` that returns the n-th Fibonacci number.

**Example:**
```
fib(0) → 0
fib(6) → 8
```
```

### Starter Code（Python）

学生看到的初始代码框架 / Initial code skeleton shown to students:

```python
def fib(n: int) -> int:
    # Your code here
    pass
```

### Solution Code（仅后台可见 / Admin only）

参考答案，**不会**暴露给学生 / Reference answer — **never** exposed to students via any public API.

```python
def fib(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

### Hints（可选 / Optional）

每条 hint 单独填写，学生点击 Hints 标签才能看到。可随时添加或删除。

Each hint is a separate entry. Students only see hints when they click the Hints tab.

---

## 测试用例 / Test Cases

> ⚠️ **最重要的部分 / Most important section**

### 核心规则 / Core Rule

**Input 必须是完整可执行的 Python 代码。**

The submit endpoint appends `input` directly to the student's code and runs the combined script. If `input` is not complete Python, there will be no output and all tests will fail.

---

### 函数题示例 / Function Problem Example

Starter code defines `def fib(n)`:

| Input | Expected Output | Hidden |
|---|---|---|
| `print(fib(0))` | `0` | No |
| `print(fib(1))` | `1` | No |
| `print(fib(6))` | `8` | No |
| `print(fib(10))` | `55` | Yes |
| `print(fib(20))` | `6765` | Yes |

---

### 类题示例 / Class Problem Example

Starter code defines `class Stack`:

| Input | Expected Output | Hidden |
|---|---|---|
| `s = Stack()`<br>`s.push(1)`<br>`s.push(2)`<br>`print(s.peek())` | `2` | No |
| `s = Stack()`<br>`s.push(1)`<br>`s.push(2)`<br>`s.pop()`<br>`print(s.size())` | `1` | No |
| `s = Stack()`<br>`print(s.is_empty())` | `True` | No |
| `s = Stack()`<br>`s.push(5)`<br>`s.pop()`<br>`print(s.is_empty())` | `True` | Yes |

---

### Hidden 测试用例 / Hidden Test Cases

- 勾选 **Hidden** 的用例**不会**在插件里展示给学生
- Submit 时仍然参与评测
- 用途：防止学生根据样例硬编码答案

Hidden test cases are **not shown** to students in the extension, but they are still evaluated on submit. Use them to prevent hard-coded answers.

---

## 发布流程 / Publishing

1. 填完所有字段 / Fill in all fields
2. 点**保存草稿** / Click **Save Draft** — saves without making it visible to students
3. 确认无误后点**发布上线** / Click **Publish** — immediately visible to all students via the VSCode extension
4. 已发布题目可随时点**取消发布** / Published problems can be unpublished anytime

> The VSCode extension fetches problems live — no plugin update needed when you add or edit problems.

---

## 常见错误 / Common Mistakes

### Input 格式错误 / Wrong Input Format

❌ `fib(0)` — 只是函数调用，没有 print / Just a function call, no print output
✅ `print(fib(0))` — 完整语句，有输出 / Complete statement with output

❌ `fibonacci(0)` — 函数名和 starter code 不一致 / Wrong function name
✅ `print(fibonacci(0))` — 和 starter code 里的函数名一致 / Matches starter code

❌ `print(fib(6))` → expected `8 ` (trailing space) — 多余空格 / Trailing space
✅ `print(fib(6))` → expected `8` — Python `print` 不加尾随空格 / No trailing whitespace

### 类题 / Class Problems

❌ Input 里直接调用方法而没有先创建对象:
```
s.push(1)
```

✅ 每个 test case 都要从创建对象开始:
```
s = Stack()
s.push(1)
print(s.size())
```

### Expected Output 格式 / Expected Output Format

Python `print` 的输出规则 / Python `print` output rules:
- `print(True)` → `True` (capital T, not `true`)
- `print(1.0)` → `1.0` (keeps decimal)
- `print([1, 2])` → `[1, 2]` (with spaces after commas)
- `print("hello")` → `hello` (no quotes)

---

## 批量导入（高级）/ Bulk Import (Advanced)

对于大量题目，可以用 Python 脚本批量导入 / For many problems, use the import script:

```bash
# 预览（不写数据库）/ Preview (no DB writes)
python scripts/import_problems.py --dir ./py_files --course COMP9021 --dry-run

# 实际导入 / Actual import
python scripts/import_problems.py --dir ./py_files --course COMP9021 --import
```

题目文件要求 / File requirements:
- 函数名必须是 `f` / Function name must be `f`
- 测试用例用 doctest 格式写在 docstring 里 / Test cases in doctest format inside docstring

安装依赖 / Install dependencies: `pip install supabase python-dotenv`
