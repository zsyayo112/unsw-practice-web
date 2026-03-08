"""
import_problems.py — 批量导入 COMP9021 .py 题目文件到 Supabase

用法：
  python import_problems.py --dir ./py_files --course COMP9021 --dry-run
  python import_problems.py --dir ./py_files --course COMP9021 --import
  python import_problems.py --file single_file.py --dry-run

依赖：
  pip install supabase python-dotenv

从项目根目录的 .env.local 读取：
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
"""

import argparse
import ast
import os
import re
import sys
from pathlib import Path
from typing import Any


def load_env() -> dict[str, str]:
    """从项目根目录的 .env.local 读取 Supabase 配置"""
    script_dir = Path(__file__).parent
    env_path = script_dir.parent / ".env.local"
    if not env_path.exists():
        print(f"错误：找不到 {env_path}", file=sys.stderr)
        sys.exit(1)

    from dotenv import dotenv_values
    config = dotenv_values(env_path)

    url = config.get("NEXT_PUBLIC_SUPABASE_URL")
    key = config.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        print("错误：.env.local 缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY", file=sys.stderr)
        sys.exit(1)

    return {"url": url, "key": key}


def infer_topics(source: str) -> list[str]:
    """根据源码内容推断 topics"""
    lower = source.lower()
    if "recursion" in lower or "recursive" in lower:
        return ["recursion"]
    if "class " in lower:
        return ["oop"]
    if "sort" in lower:
        return ["sorting"]
    if "open(" in lower or " file" in lower:
        return ["file-io"]
    return ["general"]


def infer_difficulty(body_lines: list[str]) -> str:
    """根据函数体行数推断难度（不含空行和纯注释行）"""
    meaningful = [
        ln for ln in body_lines
        if ln.strip() and not ln.strip().startswith("#")
    ]
    count = len(meaningful)
    if count < 15:
        return "easy"
    elif count <= 40:
        return "medium"
    return "hard"


def extract_doctest_cases(docstring: str) -> list[dict[str, str]]:
    """从 docstring 提取 doctest 测试用例"""
    cases: list[dict[str, str]] = []
    lines = docstring.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = re.match(r">>>\s*(f\(.*\))\s*$", line)
        if m:
            call = m.group(1)
            expected_lines: list[str] = []
            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                if next_line.startswith(">>>") or next_line == "":
                    break
                expected_lines.append(lines[j].strip())
                j += 1
            if expected_lines:
                cases.append({
                    "input": f"print({call})",
                    "expected_output": "\n".join(expected_lines),
                })
            i = j
        else:
            i += 1
    return cases


def parse_file(filepath: str | Path) -> dict[str, Any] | None:
    """从单个 .py 文件提取题目信息"""
    filepath = Path(filepath)
    source = filepath.read_text(encoding="utf-8")
    filename = filepath.name

    # slug: 去掉 .py，空格转 -，小写
    slug = re.sub(r"\s+", "-", filepath.stem).lower()
    slug = re.sub(r"[^a-z0-9\-_]", "", slug)

    # 解析 AST 找函数 f
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        print(f"  ✗ 语法错误：{e}")
        return None

    func_node: ast.FunctionDef | None = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == "f":
            func_node = node
            break

    if func_node is None:
        print(f"  ✗ 未找到函数 f，跳过")
        return None

    source_lines = source.splitlines()

    # 函数签名行（def f(...)）
    func_start = func_node.lineno - 1  # 0-indexed
    func_end = func_node.end_lineno    # 1-indexed inclusive

    # docstring
    docstring = ast.get_docstring(func_node) or ""

    # starter_code：函数签名 + docstring + pass（去掉函数体）
    sig_line = source_lines[func_start]
    if docstring:
        # 找到 docstring 结束行
        ds_node = func_node.body[0]
        if isinstance(ds_node, ast.Expr) and isinstance(ds_node.value, ast.Constant):
            ds_end = ds_node.end_lineno  # 1-indexed inclusive
            ds_lines = source_lines[func_start:ds_end]
            starter_code = "\n".join(ds_lines) + "\n    pass"
        else:
            starter_code = sig_line + "\n    pass"
    else:
        starter_code = sig_line + "\n    pass"

    # solution_code：原始函数实现（含签名到函数末尾）
    solution_code = "\n".join(source_lines[func_start:func_end])

    # 函数体行（用于推断难度）
    body_start = func_node.body[0].lineno - 1  # 0-indexed
    # 跳过 docstring
    if docstring:
        ds_node = func_node.body[0]
        if isinstance(ds_node, ast.Expr) and isinstance(ds_node.value, ast.Constant):
            body_content_start = ds_node.end_lineno  # next line after docstring
            body_lines = source_lines[body_content_start:func_end]
        else:
            body_lines = source_lines[body_start:func_end]
    else:
        body_lines = source_lines[body_start:func_end]

    # test_cases
    test_cases = extract_doctest_cases(docstring)

    # topics
    topics = infer_topics(solution_code)

    # difficulty
    difficulty = infer_difficulty(body_lines)

    return {
        "slug": slug,
        "title": filepath.stem,
        "description": "",
        "starter_code": starter_code,
        "solution_code": solution_code,
        "test_cases": test_cases,
        "topics": topics,
        "difficulty": difficulty,
    }


def print_parse_result(problem: dict[str, Any]) -> None:
    print(f"  ✓ slug: {problem['slug']}")
    print(f"  ✓ 测试用例: {len(problem['test_cases'])} 个")
    print(f"  ✓ 难度推断: {problem['difficulty']}")
    print(f"  ✓ topics: {problem['topics']}")
    if not problem["description"]:
        print(f"  ⚠ 描述为空，需要手动在管理后台补充")


def import_to_supabase(
    problems: list[dict[str, Any]],
    course_code: str,
    dry_run: bool,
) -> None:
    if dry_run:
        print(f"\n=== DRY RUN — 共 {len(problems)} 个题目（不写数据库）===\n")
        for p in problems:
            print(f"[{p['slug']}]")
            print_parse_result(p)
            print()
        return

    # 实际导入
    env = load_env()
    from supabase import create_client

    client = create_client(env["url"], env["key"])

    # 获取 course_id
    course_res = client.table("courses").select("id").eq("code", course_code).execute()
    if not course_res.data:
        print(f"错误：找不到课程 {course_code}，请先在 courses 表中创建", file=sys.stderr)
        sys.exit(1)
    course_id: str = course_res.data[0]["id"]

    # 获取已存在 slug
    existing_res = client.table("problems").select("slug").eq("course_id", course_id).execute()
    existing_slugs: set[str] = {row["slug"] for row in (existing_res.data or [])}

    success = 0
    skipped = 0
    failed = 0

    for p in problems:
        slug = p["slug"]
        if slug in existing_slugs:
            print(f"  跳过（已存在）: {slug}")
            skipped += 1
            continue

        try:
            problem_res = client.table("problems").insert({
                "course_id": course_id,
                "slug": slug,
                "title": p["title"],
                "description": p["description"],
                "difficulty": p["difficulty"],
                "topics": p["topics"],
                "starter_code": p["starter_code"],
                "solution_code": p["solution_code"],
            }).execute()

            problem_id: str = problem_res.data[0]["id"]

            for i, tc in enumerate(p["test_cases"]):
                client.table("test_cases").insert({
                    "problem_id": problem_id,
                    "input": tc["input"],
                    "expected_output": tc["expected_output"],
                    "order_index": i,
                }).execute()

            print(f"  ✓ 导入成功: {slug}（{len(p['test_cases'])} 个测试用例）")
            success += 1

        except Exception as e:
            print(f"  ✗ 导入失败: {slug} — {e}")
            failed += 1

    print(f"\n导入成功: {success} / 跳过(已存在): {skipped} / 失败: {failed}")


def collect_files(args: argparse.Namespace) -> list[Path]:
    if args.file:
        p = Path(args.file)
        if not p.exists():
            print(f"错误：文件不存在：{args.file}", file=sys.stderr)
            sys.exit(1)
        return [p]

    d = Path(args.dir)
    if not d.is_dir():
        print(f"错误：目录不存在：{args.dir}", file=sys.stderr)
        sys.exit(1)
    return sorted(d.glob("*.py"))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="批量导入 .py 题目文件到 Supabase"
    )
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--dir", help="包含 .py 文件的目录")
    source_group.add_argument("--file", help="单个 .py 文件路径")

    parser.add_argument("--course", default="COMP9021", help="课程代码（默认 COMP9021）")

    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--dry-run", action="store_true", help="只解析，不写数据库")
    mode_group.add_argument("--import", dest="do_import", action="store_true", help="解析并导入到 Supabase")

    args = parser.parse_args()

    files = collect_files(args)
    if not files:
        print("没有找到 .py 文件")
        sys.exit(0)

    problems: list[dict[str, Any]] = []
    parse_errors = 0

    for f in files:
        print(f"解析 {f.name}...")
        result = parse_file(f)
        if result is None:
            parse_errors += 1
            continue
        print_parse_result(result)
        print()
        problems.append(result)

    print(f"完成：解析 {len(files)} 个文件（成功 {len(problems)} / 失败 {parse_errors}）\n")

    if not problems:
        print("没有可导入的题目")
        sys.exit(0)

    import_to_supabase(problems, args.course, dry_run=args.dry_run)


if __name__ == "__main__":
    main()


# =============================================================================
# 使用说明
# =============================================================================
#
# 1. 安装依赖：
#      pip install supabase python-dotenv
#
# 2. 确保项目根目录有 .env.local，包含：
#      NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#
# 3. 命令示例：
#
#    预览解析结果（不写数据库）：
#      python scripts/import_problems.py --dir ./py_files --course COMP9021 --dry-run
#
#    单文件预览：
#      python scripts/import_problems.py --file fibonacci.py --dry-run
#
#    实际导入：
#      python scripts/import_problems.py --dir ./py_files --course COMP9021 --import
#
# 4. 题目文件格式要求：
#    - 函数名必须是 f（单字母）
#    - 测试用例用 doctest 格式写在 docstring 里：
#        >>> f(0)
#        0
#    - 支持多行输出：紧跟在 >>> 调用后面的非 >>> 行都算输出
#
# 5. 导入行为：
#    - slug 已存在的题目自动跳过（不覆盖）
#    - 描述字段默认为空，需手动在管理后台补充
#    - 导入完成后打印：成功 X / 跳过 Y / 失败 Z
#
# =============================================================================
